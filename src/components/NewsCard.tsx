import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { BookmarkPlus, Check, Eye, ExternalLink, X, Bookmark, GripVertical, Tag } from 'lucide-react';
import { NewsItem, ColumnType } from '../types';

interface NewsCardProps {
  item: NewsItem;
  onStatusChange: (id: string, status: 'unread' | 'readLater' | 'read' | 'removed') => void;
  columnType: ColumnType;
}

export function NewsCard({ item, onStatusChange, columnType }: NewsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [animateButton, setAnimateButton] = useState<string | null>(null);
  const [matchingKeywords, setMatchingKeywords] = useState<string[]>([]);

  // Set up drag source
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'newsCard',
    item: { id: item.id, type: 'newsCard', originalStatus: columnType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Extract keywords from searchConfig in localStorage
  useEffect(() => {
    const findKeywords = () => {
      try {
        const configJSON = localStorage.getItem('searchConfig');
        if (configJSON) {
          const config = JSON.parse(configJSON);
          
          if (config && Array.isArray(config.keywords)) {
            const contentLower = (item.title + ' ' + item.content).toLowerCase();
            const matches = config.keywords.filter(keyword => 
              contentLower.includes(keyword.toLowerCase())
            );
            setMatchingKeywords(matches);
          }
        }
      } catch (error) {
        console.error('Error getting keywords:', error);
      }
    };

    findKeywords();
  }, [item.title, item.content]);

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

  // Get card styles based on column type
  const getCardStyles = () => {
    // Base styles
    let styles = "p-4 rounded-lg shadow transition-all duration-200 border draggable-card card-transition ";
    
    // Styles based on column type
    if (columnType === 'unread') {
      styles += isHovered 
        ? "bg-[#1e293b] border-blue-800" 
        : "bg-[#172033] border-blue-900 border-opacity-40";
    } else if (columnType === 'readLater') {
      styles += isHovered 
        ? "bg-[#2b2033] border-purple-800" 
        : "bg-[#231b2b] border-purple-900 border-opacity-40";
    } else if (columnType === 'read') {
      styles += isHovered 
        ? "bg-[#22302b] border-green-800" 
        : "bg-[#192720] border-green-900 border-opacity-40";
    }
    
    // Add dragging styles
    if (isDragging) {
      styles += " opacity-50 border-dashed";
    }
    
    return styles;
  };

  // Get action button styles based on column type
  const getActionButtonStyles = (isHovered: boolean) => {
    let baseStyles = "px-2 py-1 text-xs rounded-md transition-colors ";
    
    if (columnType === 'unread') {
      return baseStyles + (isHovered ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-800");
    } else if (columnType === 'readLater') {
      return baseStyles + (isHovered ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-800");
    } else if (columnType === 'read') {
      return baseStyles + (isHovered ? "bg-green-600 hover:bg-green-700" : "bg-green-800");
    }
    
    return baseStyles + "bg-gray-700 hover:bg-gray-600";
  };

  return (
    <div
      ref={drag}
      className={getCardStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <h3 className="font-bold text-[#e0e0e0] mb-2 line-clamp-2">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-300 transition-colors"
        >
          {item.title}
        </a>
      </h3>
      
      <div className="text-sm text-[#a0a0a0] mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: item.content }} />
      
      {matchingKeywords.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={14} className="text-blue-400" />
            <span className="text-xs text-blue-400">Matching keywords:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {matchingKeywords.map((keyword, idx) => (
              <span 
                key={idx} 
                className="text-xs px-2 py-0.5 bg-blue-900 bg-opacity-30 text-blue-300 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-[#a0a0a0]">
          <span className={`font-medium px-2 py-1 rounded-md ${
            columnType === 'unread' ? "bg-blue-900 bg-opacity-30 text-blue-300" :
            columnType === 'readLater' ? "bg-purple-900 bg-opacity-30 text-purple-300" :
            "bg-green-900 bg-opacity-30 text-green-300"
          }`}>{item.source}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp)}</span>
        </div>
        
        <div className="flex gap-1">
          {columnType === 'unread' && (
            <>
              <button
                onClick={() => {
                  setAnimateButton('readLater');
                  setTimeout(() => onStatusChange(item.id, 'readLater'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'readLater' ? 'scale-90' : ''}`}
                title="Read Later"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setAnimateButton('read');
                  setTimeout(() => onStatusChange(item.id, 'read'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'read' ? 'scale-90' : ''}`}
                title="Mark as Read"
              >
                Read
              </button>
            </>
          )}
          
          {columnType === 'readLater' && (
            <>
              <button
                onClick={() => {
                  setAnimateButton('unread');
                  setTimeout(() => onStatusChange(item.id, 'unread'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'unread' ? 'scale-90' : ''}`}
                title="Move to Unread"
              >
                Unread
              </button>
              <button
                onClick={() => {
                  setAnimateButton('read');
                  setTimeout(() => onStatusChange(item.id, 'read'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'read' ? 'scale-90' : ''}`}
                title="Mark as Read"
              >
                Read
              </button>
            </>
          )}
          
          {columnType === 'read' && (
            <>
              <button
                onClick={() => {
                  setAnimateButton('unread');
                  setTimeout(() => onStatusChange(item.id, 'unread'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'unread' ? 'scale-90' : ''}`}
                title="Move to Unread"
              >
                Unread
              </button>
              <button
                onClick={() => {
                  setAnimateButton('readLater');
                  setTimeout(() => onStatusChange(item.id, 'readLater'), 150);
                }}
                className={`${getActionButtonStyles(isHovered)} ${animateButton === 'readLater' ? 'scale-90' : ''}`}
                title="Read Later"
              >
                Later
              </button>
            </>
          )}
          
          <button
            onClick={() => {
              setAnimateButton('removed');
              setTimeout(() => onStatusChange(item.id, 'removed'), 150);
            }}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              isHovered ? 'bg-red-600 hover:bg-red-700' : 'bg-red-900'
            } ${animateButton === 'removed' ? 'scale-90' : ''}`}
            title="Remove"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}