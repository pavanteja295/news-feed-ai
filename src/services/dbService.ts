import { NewsItem } from '../types';

// Database configuration
const DB_NAME = 'NewsFeedDB';
const DB_VERSION = 1;
const ARTICLE_STORE = 'articles';

// Initialize the database
export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      console.error('IndexedDB not supported in this browser');
      reject('IndexedDB not supported');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening database:', event);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      console.log('Database opened successfully');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create an object store for articles if it doesn't exist
      if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
        const articleStore = db.createObjectStore(ARTICLE_STORE, { keyPath: 'id' });
        articleStore.createIndex('url', 'url', { unique: true });
        articleStore.createIndex('status', 'status', { unique: false });
        console.log('Article store created');
      }
    };
  });
};

// Save articles to IndexedDB
export const saveArticles = (articles: NewsItem[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => {
      console.error('Error opening database for saving:', event);
      reject('Error opening database for saving');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(ARTICLE_STORE, 'readwrite');
      const store = transaction.objectStore(ARTICLE_STORE);

      // Clear existing data and add new articles
      store.clear();
      
      articles.forEach((article) => {
        store.put(article);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (error) => {
        console.error('Transaction error:', error);
        reject('Transaction error');
      };
    };
  });
};

// Load articles from IndexedDB
export const loadArticles = (): Promise<NewsItem[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => {
      console.error('Error opening database for loading:', event);
      reject('Error opening database for loading');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(ARTICLE_STORE, 'readonly');
      const store = transaction.objectStore(ARTICLE_STORE);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = (error) => {
        console.error('Error getting articles:', error);
        reject('Error getting articles');
      };
    };
  });
};

// Update a single article's status
export const updateArticleStatus = (id: string, status: 'unread' | 'readLater' | 'read' | 'removed'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => {
      console.error('Error opening database for updating:', event);
      reject('Error opening database for updating');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(ARTICLE_STORE, 'readwrite');
      const store = transaction.objectStore(ARTICLE_STORE);
      
      // Get the current article
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const article = getRequest.result;
          article.status = status;
          store.put(article);
          resolve();
        } else {
          reject('Article not found');
        }
      };

      getRequest.onerror = (error) => {
        console.error('Error getting article for update:', error);
        reject('Error getting article for update');
      };

      transaction.onerror = (error) => {
        console.error('Transaction error during update:', error);
        reject('Transaction error during update');
      };
    };
  });
};

// Helper function to merge existing indexed DB data with fresh API data
export const mergeArticles = (freshArticles: NewsItem[], existingArticles: NewsItem[]): NewsItem[] => {
  const articlesMap = new Map<string, NewsItem>();
  
  // First add all existing articles to the map (preserving user status)
  existingArticles.forEach(article => {
    articlesMap.set(article.id, article);
  });
  
  // Then add or update with fresh articles, but preserve status for existing ones
  freshArticles.forEach(freshArticle => {
    const existingArticle = existingArticles.find(a => a.url === freshArticle.url);
    
    if (existingArticle) {
      // Preserve status for existing articles
      articlesMap.set(existingArticle.id, {
        ...freshArticle,
        id: existingArticle.id, // Keep original ID for consistency
        status: existingArticle.status
      });
    } else {
      // Add new article
      articlesMap.set(freshArticle.id, freshArticle);
    }
  });
  
  // Convert map back to array
  return Array.from(articlesMap.values());
}; 