import { NewsItem, SearchConfig } from '../types';

// Function to fetch news from various sources
export async function fetchNews(config: SearchConfig): Promise<NewsItem[]> {
  try {
    // We'll use a combination of approaches:
    // 1. News API for general sources (requires API key)
    // 2. RSS feeds for direct source feeds

    const newsItems: NewsItem[] = [];
    
    // Fetch from News API if we have an API key
    if (process.env.VITE_NEWS_API_KEY) {
      await fetchFromNewsAPI(config, newsItems);
    }
    
    // Fetch from RSS feeds for specific sources
    await fetchFromRSSFeeds(config, newsItems);
    
    // Sort by newest first
    return newsItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return []; // Return empty array on error
  }
}

// Fetch from News API (https://newsapi.org/)
async function fetchFromNewsAPI(config: SearchConfig, newsItems: NewsItem[]) {
  const apiKey = process.env.VITE_NEWS_API_KEY;
  const keywords = config.keywords.join(' OR ');
  const sources = config.sources
    .map(source => source.toLowerCase().replace(/\s+/g, '-'))
    .join(',');
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&sources=${sources}&sortBy=publishedAt&apiKey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'ok' && data.articles) {
    data.articles.forEach((article: any, index: number) => {
      newsItems.push({
        id: `newsapi-${index}-${Date.now()}`,
        title: article.title,
        content: article.description || article.content || '',
        url: article.url,
        source: article.source.name,
        timestamp: article.publishedAt,
        status: 'unread'
      });
    });
  }
}

// Fetch from RSS feeds using a proxy service like rss2json
async function fetchFromRSSFeeds(config: SearchConfig, newsItems: NewsItem[]) {
  // Map of source names to their RSS feed URLs
  const rssFeeds: Record<string, string> = {
    'TechCrunch': 'https://techcrunch.com/feed/',
    'The Verge': 'https://www.theverge.com/rss/index.xml',
    'Wired': 'https://www.wired.com/feed/rss'
  };
  
  // Only fetch from sources in the config
  const sourcesToFetch = config.sources.filter(source => source in rssFeeds);
  
  for (const source of sourcesToFetch) {
    try {
      // Using rss2json as a proxy to convert RSS to JSON
      const rssUrl = rssFeeds[source];
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        // Filter items based on keywords
        const filteredItems = data.items.filter((item: any) => {
          const content = (item.title + ' ' + item.description).toLowerCase();
          return config.keywords.some(keyword => 
            content.includes(keyword.toLowerCase())
          );
        });
        
        filteredItems.forEach((item: any, index: number) => {
          newsItems.push({
            id: `rss-${source}-${index}-${Date.now()}`,
            title: item.title,
            content: item.description || '',
            url: item.link,
            source: source,
            timestamp: item.pubDate,
            status: 'unread'
          });
        });
      }
    } catch (error) {
      console.error(`Error fetching from ${source} RSS:`, error);
    }
  }
}

// Fallback function that returns mock data if all API/RSS methods fail
export function getMockNews(): NewsItem[] {
  return [
    {
      id: '1',
      title: 'OpenAI announces GPT-4 Turbo with 128K context window',
      content: 'OpenAI today announced GPT-4 Turbo, which can handle longer conversations up to 128,000 tokens in length, or about 300 pages of text. The model is also more capable at coding, math, and analysis tasks...',
      url: 'https://techcrunch.com/2024/03/19/openai-announces-gpt-4-turbo/',
      source: 'TechCrunch',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'unread'
    },
    // ... other mock items from original code ...
  ];
} 