export interface NewsItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  timestamp: string;
  status: 'unread' | 'readLater' | 'read' | 'removed';
}

export interface SearchConfig {
  keywords: string[];
  sources: string[];
  filterMode: 'any' | 'all' | 'categorized';
}

export type ColumnType = 'unread' | 'readLater' | 'read';

export interface DragItem {
  id: string;
  type: string;
  originalStatus: 'unread' | 'readLater' | 'read';
}

export interface ManagementProps {
  config: SearchConfig;
  onUpdate: (newConfig: SearchConfig) => void;
}