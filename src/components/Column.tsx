import React, { ReactNode } from 'react';
import { useDrop } from 'react-dnd';
import { NewsItem, ColumnType, DragItem } from '../types';
import { NewsCard } from './NewsCard';

interface ColumnProps {
  title: string;
  items: NewsItem[];
  onStatusChange: (id: string, status: 'unread' | 'readLater' | 'read' | 'removed') => void;
  emptyState?: ReactNode;
  columnType: ColumnType;
}

export function Column({ title, items, onStatusChange, emptyState, columnType }: ColumnProps) {
  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'newsCard',
    drop: (item: DragItem) => {
      if (item.originalStatus !== columnType) {
        onStatusChange(item.id, columnType);
      }
    },
    canDrop: (item: DragItem) => item.originalStatus !== columnType,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));
  
  // Get column header color based on type
  const getHeaderStyles = () => {
    if (columnType === 'unread') {
      return "text-blue-300 border-blue-800";
    } else if (columnType === 'readLater') {
      return "text-purple-300 border-purple-800";
    } else if (columnType === 'read') {
      return "text-green-300 border-green-800";
    }
    return "text-[#e0e0e0] border-gray-700";
  };
  
  // Get column border color based on drop state and type
  const getColumnStyles = () => {
    let baseStyles = "flex-1 min-w-0 p-4 bg-[#181818] rounded-lg shadow-lg border ";
    
    if (isOver && canDrop) {
      if (columnType === 'unread') {
        return baseStyles + "ring-2 ring-blue-500 ring-opacity-70 border-blue-700";
      } else if (columnType === 'readLater') {
        return baseStyles + "ring-2 ring-purple-500 ring-opacity-70 border-purple-700";
      } else if (columnType === 'read') {
        return baseStyles + "ring-2 ring-green-500 ring-opacity-70 border-green-700";
      }
    }
    
    if (columnType === 'unread') {
      return baseStyles + "border-blue-900 border-opacity-50";
    } else if (columnType === 'readLater') {
      return baseStyles + "border-purple-900 border-opacity-50";
    } else if (columnType === 'read') {
      return baseStyles + "border-green-900 border-opacity-50";
    }
    
    return baseStyles + "border-gray-800";
  };
  
  // Get badge color based on column type
  const getBadgeStyles = () => {
    if (columnType === 'unread') {
      return "bg-blue-900 bg-opacity-30 text-blue-300";
    } else if (columnType === 'readLater') {
      return "bg-purple-900 bg-opacity-30 text-purple-300";
    } else if (columnType === 'read') {
      return "bg-green-900 bg-opacity-30 text-green-300";
    }
    return "bg-gray-700 text-[#e0e0e0]";
  };

  return (
    <div 
      className={getColumnStyles()}
      ref={drop}
    >
      <h2 className={`text-xl font-bold mb-4 pb-2 border-b flex items-center ${getHeaderStyles()}`}>
        <span>{title}</span>
        {items.length > 0 && (
          <span className={`ml-2 ${getBadgeStyles()} text-xs px-2 py-0.5 rounded-full`}>
            {items.length}
          </span>
        )}
      </h2>
      <div className={`space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 custom-scrollbar
                     ${isOver && canDrop ? 
                      columnType === 'unread' ? 'bg-blue-900 bg-opacity-5' :
                      columnType === 'readLater' ? 'bg-purple-900 bg-opacity-5' :
                      columnType === 'read' ? 'bg-green-900 bg-opacity-5' :
                      'bg-gray-900 bg-opacity-5'
                      : ''} rounded-md transition-colors duration-200`}>
        {items.length > 0 ? (
          items.map(item => (
            <NewsCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              columnType={columnType}
            />
          ))
        ) : (
          emptyState || (
            <div className="p-6 text-center text-gray-500 bg-[#222222] rounded-lg border border-dashed border-gray-700">
              No articles
            </div>
          )
        )}
      </div>
    </div>
  );
}