import { NewsItem, SearchConfig } from '../types';

// Map of source names to their RSS feed URLs - moved to top level so it can be updated
const rssFeeds: Record<string, string> = {
  // GPU/Graphics focused sources
  'Nvidia Blog': 'https://feeds.feedburner.com/nvidiablog',
  'AMD Blog': 'https://community.amd.com/community-feed',
  // 'Tom\'s Hardware': 'https://www.tomshardware.com/feeds/all',
  // 'AnandTech': 'https://www.anandtech.com/rss/',
  // 'TechPowerUp': 'https://www.techpowerup.com/rss/news',
  // 'VideoCardz': 'https://videocardz.com/feed',
  // 'Graphics Programming Weekly': 'https://www.jendrikillner.com/tags/weekly/index.xml',
  
  // 3D/Mesh/Simulation focused
  // 'Blender Nation': 'https://www.blendernation.com/feed/',
  // 'CGChannel': 'https://www.cgchannel.com/feed/',
  'CG Society': 'https://feeds.feedburner.com/CGSociety',
  'Unity Blog': 'https://blog.unity.com/api/rss/feed?source=blog',
  'Unreal Engine Blog': 'https://www.unrealengine.com/en-US/blog-rss',
  'Houdini Blog': 'https://www.sidefx.com/feed/',
  'Computer Graphics World': 'https://www.cgw.com/feed/',
  
  // General tech with strong GPU/Graphics coverage
  // 'Hacker News': 'https://hnrss.org/frontpage',
  'TechCrunch': 'https://techcrunch.com/feed/',
  'The Verge': 'https://www.theverge.com/rss/index.xml',
  'Wired': 'https://www.wired.com/feed/rss',
  'Ars Technica': 'https://feeds.arstechnica.com/arstechnica/index',
  // 'PC Gamer': 'https://www.pcgamer.com/rss/',
  // 'Digital Trends': 'https://www.digitaltrends.com/feed/',
  'MIT Technology Review': 'https://www.technologyreview.com/feed/',
  // 'TechRadar': 'https://www.techradar.com/rss',
  // 'CNET': 'https://www.cnet.com/rss/news/',
  // 'Engadget': 'https://www.engadget.com/rss.xml',
  // 'PCWorld': 'https://www.pcworld.com/feed',
  // 'GameSpot': 'https://www.gamespot.com/feeds/game-news',
  'Intel Graphics Blog': 'https://community.intel.com/t5/Blogs/Tech-Innovation/Artificial-Intelligence-Intel-oneAPI-Toolkits/bg-p/blog-ai-oneapi/rss',
  'Google AI Blog': 'https://blog.google/technology/ai/rss/',
  'OpenAI Blog': 'https://openai.com/blog/rss.xml',
  'DeepMind Blog': 'https://www.deepmind.com/blog/rss.xml',
  'Meta AI Research': 'https://ai.meta.com/blog/rss/',
  'Microsoft Research': 'https://www.microsoft.com/en-us/research/feed/',
  'Stability AI Blog': 'https://stability.ai/news?format=rss',
  'Two Minute Papers': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg',
  'New Scientist': 'https://www.newscientist.com/feed/home/',
  // 'Fast Company': 'https://www.fastcompany.com/technology/rss',
  // 'Physics-Based Deep Learning': 'https://physicsbaseddeeplearning.org/feed.xml'
};

// Function to fetch news from various sources
export async function fetchNews(config: SearchConfig): Promise<NewsItem[]> {
  try {
    const newsItems: NewsItem[] = [];
    
    // Just use RSS feeds - remove News API dependency
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

// Modified keyword matching logic using OR between all keywords
function contentMatchesKeywords(content: {title: string, content: string}, keywords: string[]): boolean {
  if (!keywords.length) return true;
  
  // Convert content to lowercase for case-insensitive matching
  const lowercaseContent = (content.title + ' ' + content.content).toLowerCase();
  
  // Match if ANY keyword is found (OR logic)
  return keywords.some(kw => lowercaseContent.includes(kw.toLowerCase()));
}

// Fetch from RSS feeds using a proxy service like rss2json
async function fetchFromRSSFeeds(config: SearchConfig, newsItems: NewsItem[]) {
  // Only fetch from sources in the config that exist in our rssFeeds object
  const sourcesToFetch = config.sources.filter(source => source in rssFeeds);
  
  console.log("Sources to fetch:", sourcesToFetch);
  
  for (const source of sourcesToFetch) {
    try {
      // Using rss2json as a proxy to convert RSS to JSON
      const rssUrl = rssFeeds[source];
      console.log(`Fetching ${source} from URL: ${rssUrl}`);
      
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        console.log(`Success from ${source}: Found ${data.items.length} items`);
        
        // Process each item, adding validation to ensure we only get valid articles
        data.items.forEach((item: any, index: number) => {
          // Validate that we have all the required fields
          if (item.title && item.link && typeof item.title === 'string' && typeof item.link === 'string') {
            // Ensure the URL starts with http:// or https://
            if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
              // Process description - fix cases where it's just a URL or empty
              let processedContent = '';
              
              if (item.description) {
                // Check if description is just a URL
                if (item.description.trim().startsWith('http://') || 
                    item.description.trim().startsWith('https://') ||
                    item.description === item.link) {
                  // If it's just a URL, use a generic description
                  processedContent = `Click to read the full article from ${source}.`;
                } else {
                  // Use the description but clean it up
                  
                  // Remove excessive HTML tags but keep basic formatting
                  let content = item.description;
                  
                  // Strip script tags completely for security
                  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                  
                  // Convert image tags to a simple [Image] placeholder to save space
                  content = content.replace(/<img[^>]*>/gi, '[Image] ');
                  
                  // Limit content length to avoid overly long descriptions
                  if (content.length > 500) {
                    content = content.substring(0, 500) + '...';
                  }
                  
                  processedContent = content;
                }
              } else {
                // No description provided
                processedContent = `Click to read the full article from ${source}.`;
              }
              
              // Create a clean title (remove any HTML)
              const cleanTitle = item.title.replace(/<[^>]*>/g, '');
              
              const newsItem = {
                id: `rss-${source}-${index}-${Date.now()}`,
                title: cleanTitle,
                content: processedContent,
                url: item.link,
                source: source,
                timestamp: item.pubDate || new Date().toISOString(),
                status: 'unread'
              };
              
              // Filter based on keywords if needed
              if (!config.keywords.length || contentMatchesKeywords({
                title: cleanTitle,
                content: processedContent
              }, config.keywords)) {
                newsItems.push(newsItem);
              }
            } else {
              console.warn(`Invalid URL for item from ${source}:`, item.link);
            }
          } else {
            console.warn(`Invalid item data from ${source}:`, item);
          }
        });
      } else {
        console.warn(`No valid items or error from ${source}:`, data);
      }
    } catch (error) {
      console.error(`Error fetching from ${source} RSS:`, error);
    }
  }
}

// Function to add a custom news source
export function addCustomNewsSource(name: string, rssUrl: string): boolean {
  if (!name || !rssUrl) return false;
  
  // Add to our feeds map if not already present
  if (!(name in rssFeeds)) {
    rssFeeds[name] = rssUrl;
    return true;
  }
  
  return false;
}

// Function to get all available news sources
export function getAvailableNewsSources(): string[] {
  return Object.keys(rssFeeds);
} 