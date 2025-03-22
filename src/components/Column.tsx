import React from 'react';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';

interface ColumnProps {
  title: string;
  items: NewsItem[];
  onStatusChange: (id: string, status: 'unread' | 'readLater' | 'read') => void;
}

export function Column({ title, items, onStatusChange }: ColumnProps) {
  return (
    <div className="flex-1 min-w-0 p-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map(item => (
          <NewsCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}