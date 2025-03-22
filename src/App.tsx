import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Column } from './components/Column';
import { ManageFeeds } from './components/ManageFeeds';
import { NewsItem, SearchConfig } from './types';
import { fetchNews } from './services/newsService';
import { GripVertical } from 'lucide-react';
import { initDB, saveArticles, loadArticles, updateArticleStatus, mergeArticles } from './services/dbService';

// Initial config - will be stored in localStorage
const defaultConfig: SearchConfig = {
  keywords: [
    // AI keywords
    "artificial intelligence",
    "machine learning",
    "deep learning", 
    "neural networks",
    "computer vision",
    "reinforcement learning",
    
    // Graphics keywords
    "GPU",
    "graphics",
    "rendering",
    "ray tracing",
    "CUDA",
    "shader",
    "computer graphics",
    
    // Specialized ML/graphics
    "geometric deep learning",
    "graph neural networks",
    "mesh",
    "3D reconstruction",
    "physics simulation",
    "point cloud",
    "neural rendering"
  ],
  sources: [
    // Use exact names from rssFeeds
    'Nvidia Blog',
    'AMD Blog',
    'Unity Blog',
    'Unreal Engine Blog',
    'Google AI Blog',
    'OpenAI Blog',
    'DeepMind Blog',
    'Meta AI Research',
    'Microsoft Research',
    'Stability AI Blog',
    'Physics-Based Deep Learning',
    'Wired',
    'The Verge',
    'Ars Technica',
    'TechCrunch',
    'MIT Technology Review',
    'Fast Company',
    'New Scientist'
  ]
};

function App() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string; id: string} | null>(null);

  const [searchConfig, setSearchConfig] = useState<SearchConfig>(() => {
    const saved = localStorage.getItem('searchConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  // Add this function to handle saving the config to localStorage
  const saveSearchConfig = (config: SearchConfig) => {
    try {
      localStorage.setItem('searchConfig', JSON.stringify(config));
      console.log('Search config saved to localStorage', config);
    } catch (error) {
      console.error('Error saving search config:', error);
    }
  };

  // Load config from localStorage in useEffect
  useEffect(() => {
    const loadSearchConfig = () => {
      try {
        const savedConfig = localStorage.getItem('searchConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          // Validate the config has keywords and sources arrays
          if (Array.isArray(parsedConfig.keywords) && Array.isArray(parsedConfig.sources)) {
            setSearchConfig(parsedConfig);
            console.log('Loaded saved config from localStorage', parsedConfig);
            return parsedConfig;
          }
        }
        // If no valid config, use default and save it
        saveSearchConfig(defaultConfig);
        return defaultConfig;
      } catch (error) {
        console.error('Error loading search config:', error);
        // If error, use default and save it
        saveSearchConfig(defaultConfig);
        return defaultConfig;
      }
    };

    const initApp = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the database
        const dbInitialized = await initDB();
        setIsDbInitialized(dbInitialized);
        
        if (dbInitialized) {
          // Load config first, as we need it for fetching news
          const config = loadSearchConfig();
          
          // First try to load existing articles from IndexedDB
          const existingArticles = await loadArticles();
          
          if (existingArticles.length > 0) {
            console.log(`Loaded ${existingArticles.length} articles from IndexedDB`);
            setNewsItems(existingArticles);
            
            // Optionally refresh in the background
            fetchNews(config).then(freshNews => {
              if (freshNews.length > 0) {
                const mergedNews = mergeArticles(freshNews, existingArticles);
                setNewsItems(mergedNews);
                saveArticles(mergedNews);
              }
            }).catch(err => {
              console.error('Background refresh error:', err);
            });
          } else {
            // No articles in IndexedDB, fetch fresh news
            const freshNews = await fetchNews(config);
            
            if (freshNews.length > 0) {
              setNewsItems(freshNews);
              await saveArticles(freshNews);
            } else {
              setError("No news articles found matching your criteria. Try adding more sources.");
            }
          }
        }
      } catch (err) {
        console.error('Error initializing app:', err);
        setError("Failed to initialize the application. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Load news items from APIs based on search config
  useEffect(() => {
    if (!isDbInitialized) return;
    
    const loadNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const freshNews = await fetchNews(searchConfig);
        
        if (freshNews.length > 0) {
          // Load existing articles from IndexedDB to preserve status
          const existingArticles = await loadArticles();
          
          // Merge fresh news with existing items
          const mergedNews = mergeArticles(freshNews, existingArticles);
          
          // Update state and save to IndexedDB
          setNewsItems(mergedNews);
          await saveArticles(mergedNews);
        } else {
          setError("No news articles found matching your criteria. Try adding more sources or adjusting your keywords.");
        }
      } catch (err) {
        console.error('Error loading news:', err);
        setError("Failed to load news. Check your internet connection.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNews();
    
    // Set up a refresh interval - every 15 minutes
    const refreshInterval = setInterval(() => {
      loadNews();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [searchConfig, isDbInitialized]);

  // Save articles to IndexedDB whenever they change
  useEffect(() => {
    if (!isDbInitialized || newsItems.length === 0) return;
    
    const saveData = async () => {
      try {
        await saveArticles(newsItems);
      } catch (error) {
        console.error('Failed to save articles:', error);
      }
    };
    
    saveData();
  }, [newsItems, isDbInitialized]);

  // Save search config to localStorage
  useEffect(() => {
    localStorage.setItem('searchConfig', JSON.stringify(searchConfig));
  }, [searchConfig]);

  const handleStatusChange = async (id: string, newStatus: 'unread' | 'readLater' | 'read' | 'removed') => {
    try {
      // Update IndexedDB
      await updateArticleStatus(id, newStatus);
      
      // Update local state
      setNewsItems(items => {
        return items.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        );
      });

      // Show notification when an item is removed
      if (newStatus === 'removed') {
        const item = newsItems.find(item => item.id === id);
        if (item) {
          setNotification({
            message: `"${item.title.substring(0, 30)}..." has been removed`,
            id: id
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error updating article status:', error);
      setError('Failed to update article status. Please try again.');
    }
  };

  // Function to restore a removed article
  const handleUndoRemove = async (id: string) => {
    try {
      // Update IndexedDB
      await updateArticleStatus(id, 'unread');
      
      // Update local state
      setNewsItems(items => {
        return items.map(item =>
          item.id === id ? { ...item, status: 'unread' } : item
        );
      });
      
      setNotification(null);
    } catch (error) {
      console.error('Error restoring article:', error);
      setError('Failed to restore article. Please try again.');
    }
  };

  // Update this function to save to localStorage
  const handleConfigUpdate = async (newConfig: SearchConfig) => {
    setSearchConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem('searchConfig', JSON.stringify(newConfig));
    
    // Add this section to trigger a refresh of news when config is changed
    setIsLoading(true);
    try {
      const freshNews = await fetchNews(newConfig);
      
      if (freshNews.length > 0) {
        // Load existing articles from IndexedDB to preserve status
        const existingArticles = await loadArticles();
        
        // Merge fresh news with existing items
        const mergedNews = mergeArticles(freshNews, existingArticles);
        
        // Update state and save to IndexedDB
        setNewsItems(mergedNews);
        await saveArticles(mergedNews);
        
        // Clear any previous errors
        setError(null);
      } else {
        setError("No news articles found matching your criteria. Try adding more sources.");
      }
    } catch (err) {
      console.error('Error loading news after config update:', err);
      setError("Failed to load news. Check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!isDbInitialized) {
      setError('Database not initialized. Please reload the page.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const freshNews = await fetchNews(searchConfig);
      
      if (freshNews.length > 0) {
        // Get existing articles from database
        const existingArticles = await loadArticles();
        
        // Merge with fresh news
        const mergedNews = mergeArticles(freshNews, existingArticles);
        
        // Update state and save to database
        setNewsItems(mergedNews);
        await saveArticles(mergedNews);
      } else {
        setError("No news articles found matching your criteria. Try adding more sources or adjusting your keywords.");
      }
    } catch (err) {
      console.error('Error refreshing news:', err);
      setError("Failed to refresh news. Check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort items by timestamp (newest first) within each category
  const sortByDate = (items: NewsItem[]) => {
    return [...items].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // Filter out removed items first
  const activeItems = newsItems.filter(item => item.status !== 'removed');
  
  // Then sort and filter by status
  const unreadItems = sortByDate(activeItems.filter(item => item.status === 'unread'));
  const readLaterItems = sortByDate(activeItems.filter(item => item.status === 'readLater'));
  const readItems = sortByDate(activeItems.filter(item => item.status === 'read'));

  // EmptyState component for columns
  const EmptyState = ({ type }: { type: string }) => (
    <div className="p-4 border border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-[#222222] h-40">
      <p className="text-center mb-3 text-gray-400">{type === 'new' ? 'No new articles' : `No ${type} articles`}</p>
      {type === 'new' && (
        <button 
          onClick={handleRefresh} 
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : 'Refresh Now'}
        </button>
      )}
    </div>
  );

  const handleClearDatabase = async () => {
    try {
      // Delete and recreate the database
      const request = indexedDB.deleteDatabase('NewsFeedDB');
      
      request.onsuccess = async () => {
        console.log('Database deleted successfully');
        
        // Reinitialize the database
        await initDB();
        setIsDbInitialized(true);
        
        // Clear local state
        setNewsItems([]);
        
        // Refetch news
        handleRefresh();
      };
      
      request.onerror = (event) => {
        console.error('Error deleting database:', event);
        setError('Failed to reset database. Please try again.');
      };
    } catch (error) {
      console.error('Error clearing database:', error);
      setError('Failed to reset database. Please try again.');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#121212]">
        <header className="bg-[#1a1a1a] shadow-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">News Feed</h1>
                <div className="mt-2 text-sm text-gray-400">
                  Tracking: 
                  <span className="flex flex-wrap gap-1 mt-1">
                    {searchConfig.keywords.map(keyword => (
                      <span key={keyword} className="inline-block px-2 py-0.5 bg-blue-900 bg-opacity-40 text-blue-300 rounded-md">
                        {keyword}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleClearDatabase}
                  className="btn btn-danger flex items-center gap-1"
                  title="Reset database and fetch fresh news"
                >
                  Reset Data
                </button>
                <button 
                  onClick={handleRefresh}
                  className="btn btn-primary flex items-center gap-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <ManageFeeds config={searchConfig} onUpdate={handleConfigUpdate} />
              </div>
            </div>
            {error && (
              <div className="mt-2 p-3 bg-[#332211] text-yellow-300 rounded-md text-sm border border-yellow-800 fade-in">
                {error}
              </div>
            )}
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {notification && (
            <div className="mb-4 p-3 bg-[#331111] border border-red-800 rounded-md text-sm text-red-300 flex justify-between items-center fade-in">
              <span>{notification.message}</span>
              <button 
                onClick={() => handleUndoRemove(notification.id)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Undo
              </button>
            </div>
          )}
          <div className="flex gap-6 flex-wrap md:flex-nowrap">
            <Column
              title="New Articles"
              items={unreadItems}
              onStatusChange={handleStatusChange}
              emptyState={<EmptyState type="new" />}
              columnType="unread"
            />
            <Column
              title="Read Later"
              items={readLaterItems}
              onStatusChange={handleStatusChange}
              emptyState={<EmptyState type="saved" />}
              columnType="readLater"
            />
            <Column
              title="Already Read"
              items={readItems}
              onStatusChange={handleStatusChange}
              emptyState={<EmptyState type="read" />}
              columnType="read"
            />
          </div>
          
          <div className="mt-6 p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-[#e0e0e0] mb-2">Drag & Drop Tips</h3>
            <p className="text-gray-400 text-sm">
              Grab any article by the handle <span className="inline-block px-1 py-1 bg-gray-800 rounded-sm mx-1"><GripVertical size={14} className="inline text-gray-500" /></span> and drag it to another column to change its status.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-[#1e1e1e] rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-[#e0e0e0] mb-2">Persistence</h3>
            <p className="text-gray-400 text-sm">
              Your article statuses (read later, already read, removed) are now saved in your browser's database and will persist even after you close the page or restart your browser.
            </p>
          </div>
        </main>
      </div>
    </DndProvider>
  );
}

export default App;