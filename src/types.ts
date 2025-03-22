export interface NewsItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  timestamp: string;
  status: 'unread' | 'readLater' | 'read';
}

export interface SearchConfig {
  keywords: string[];
  sources: string[];
}

export interface ManagementProps {
  config: SearchConfig;
  onUpdate: (newConfig: SearchConfig) => void;
}