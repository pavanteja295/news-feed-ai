import React, { useState } from 'react';
import { X, Plus, Settings2 } from 'lucide-react';
import { SearchConfig, ManagementProps } from '../types';

export function ManageFeeds({ config, onUpdate }: ManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newSource, setNewSource] = useState('');

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !config.keywords.includes(newKeyword.trim())) {
      onUpdate({
        ...config,
        keywords: [...config.keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const addSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSource.trim() && !config.sources.includes(newSource.trim())) {
      onUpdate({
        ...config,
        sources: [...config.sources, newSource.trim()]
      });
      setNewSource('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdate({
      ...config,
      keywords: config.keywords.filter(k => k !== keyword)
    });
  };

  const removeSource = (source: string) => {
    onUpdate({
      ...config,
      sources: config.sources.filter(s => s !== source)
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
      >
        <Settings2 size={18} />
        Manage Feeds
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg p-6 z-10">
          <h3 className="text-lg font-semibold mb-4">Manage Your Feed</h3>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Keywords</h4>
            <form onSubmit={addKeyword} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add new keyword..."
                className="flex-1 px-3 py-1 border rounded-md"
              />
              <button
                type="submit"
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <Plus size={16} />
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {config.keywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sources</h4>
            <form onSubmit={addSource} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Add new source..."
                className="flex-1 px-3 py-1 border rounded-md"
              />
              <button
                type="submit"
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <Plus size={16} />
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {config.sources.map(source => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
                >
                  {source}
                  <button
                    onClick={() => removeSource(source)}
                    className="hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}