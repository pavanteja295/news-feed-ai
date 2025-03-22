import React from 'react';
import { BookmarkPlus, Check, Eye, ExternalLink } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  onStatusChange: (id: string, status: 'unread' | 'readLater' | 'read') => void;
}

export function NewsCard({ item, onStatusChange }: NewsCardProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg flex-grow">{item.title}</h3>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-gray-500 hover:text-gray-700"
        >
          <ExternalLink size={18} />
        </a>
      </div>
      <p className="text-gray-600 text-sm mb-3">{item.content.substring(0, 200)}...</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">{item.source}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp)}</span>
        </div>
        <div className="flex gap-2">
          {item.status === 'unread' && (
            <>
              <button
                onClick={() => onStatusChange(item.id, 'readLater')}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Save for later"
              >
                <BookmarkPlus size={18} />
              </button>
              <button
                onClick={() => onStatusChange(item.id, 'read')}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Mark as read"
              >
                <Check size={18} />
              </button>
            </>
          )}
          {item.status === 'readLater' && (
            <button
              onClick={() => onStatusChange(item.id, 'read')}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Mark as read"
            >
              <Eye size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}