import React, { useState, useEffect } from 'react';
import { Column } from './components/Column';
import { ManageFeeds } from './components/ManageFeeds';
import { NewsItem, SearchConfig } from './types';
import { fetchNews, getMockNews } from './services/newsService';

// Initial config - will be stored in localStorage
const defaultConfig: SearchConfig = {
  keywords: ['technology', 'AI', 'programming'],
  sources: ['TechCrunch', 'The Verge', 'Wired']
};

function App() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('newsItems');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchConfig, setSearchConfig] = useState<SearchConfig>(() => {
    const saved = localStorage.getItem('searchConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load news items from APIs based on search config
  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const freshNews = await fetchNews(searchConfig);
        
        if (freshNews.length > 0) {
          // Preserve read status of existing items
          const existingItemsMap = newsItems.reduce((acc, item) => {
            acc[item.url] = item.status;
            return acc;
          }, {} as Record<string, 'unread' | 'readLater' | 'read'>);
          
          const updatedNews = freshNews.map(item => {
            if (item.url in existingItemsMap) {
              return { ...item, status: existingItemsMap[item.url] };
            }
            return item;
          });
          
          setNewsItems(updatedNews);
        } else if (newsItems.length === 0) {
          // Use mock data if no results and no existing items
          setNewsItems(getMockNews());
          setError("Couldn't fetch real news. Using mock data instead.");
        }
      } catch (err) {
        console.error('Error loading news:', err);
        setError("Failed to load news. Check your internet connection.");
        
        if (newsItems.length === 0) {
          setNewsItems(getMockNews());
        }
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
  }, [searchConfig]);

  useEffect(() => {
    localStorage.setItem('newsItems', JSON.stringify(newsItems));
  }, [newsItems]);

  useEffect(() => {
    localStorage.setItem('searchConfig', JSON.stringify(searchConfig));
  }, [searchConfig]);

  const handleStatusChange = (id: string, newStatus: 'unread' | 'readLater' | 'read') => {
    setNewsItems(items => {
      return items.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      );
    });
  };

  const handleConfigUpdate = (newConfig: SearchConfig) => {
    setSearchConfig(newConfig);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const freshNews = await fetchNews(searchConfig);
      
      if (freshNews.length > 0) {
        // Merge new news with existing items, preserving read status
        const existingItemsMap = newsItems.reduce((acc, item) => {
          acc[item.url] = item;
          return acc;
        }, {} as Record<string, NewsItem>);
        
        // Add new items and preserve existing ones
        const mergedNews: NewsItem[] = [];
        
        // First add existing items
        for (const item of newsItems) {
          mergedNews.push(item);
        }
        
        // Then add new items that aren't already in our list
        for (const item of freshNews) {
          if (!existingItemsMap[item.url]) {
            mergedNews.push(item);
          }
        }
        
        setNewsItems(mergedNews);
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

  const unreadItems = sortByDate(newsItems.filter(item => item.status === 'unread'));
  const readLaterItems = sortByDate(newsItems.filter(item => item.status === 'readLater'));
  const readItems = sortByDate(newsItems.filter(item => item.status === 'read'));

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">News Feed</h1>
              <div className="mt-2 text-sm text-gray-600">
                Tracking: {searchConfig.keywords.join(', ')}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:text-gray-400 rounded-md"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <ManageFeeds config={searchConfig} onUpdate={handleConfigUpdate} />
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Column
            title="New Articles"
            items={unreadItems}
            onStatusChange={handleStatusChange}
          />
          <Column
            title="Read Later"
            items={readLaterItems}
            onStatusChange={handleStatusChange}
          />
          <Column
            title="Already Read"
            items={readItems}
            onStatusChange={handleStatusChange}
          />
        </div>
      </main>
    </div>
  );
}

export default App;