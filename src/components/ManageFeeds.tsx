import React, { useState, useEffect } from 'react';
import { X, Plus, Settings2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchConfig, ManagementProps } from '../types';
import { getAvailableNewsSources, addCustomNewsSource } from '../services/newsService';

export function ManageFeeds({ config, onUpdate }: ManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [customSourceName, setCustomSourceName] = useState('');
  const [customSourceUrl, setCustomSourceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [localConfig, setLocalConfig] = useState<SearchConfig>(config);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load available sources when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setAvailableSources(getAvailableNewsSources());
      setLocalConfig({...config});
    }
  }, [isOpen, config]);

  // Filter sources based on search term
  const filteredSources = availableSources
    .filter(source => !localConfig.sources.includes(source))
    .filter(source => source.toLowerCase().includes(searchTerm.toLowerCase()));

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !localConfig.keywords.includes(newKeyword.trim())) {
      setLocalConfig({
        ...localConfig,
        keywords: [...localConfig.keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const addSelectedSources = () => {
    if (selectedSources.length === 0) return;
    
    const newSources = selectedSources.filter(source => !localConfig.sources.includes(source));
    
    if (newSources.length > 0) {
      setLocalConfig({
        ...localConfig,
        sources: [...localConfig.sources, ...newSources]
      });
      setMessage(`Added ${newSources.length} source${newSources.length > 1 ? 's' : ''}. Click Save & Update to refresh.`);
    }
    
    setSelectedSources([]);
    setShowSourceSelector(false);
    setSearchTerm('');
  };

  const toggleSourceSelection = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const removeKeyword = (keyword: string) => {
    setLocalConfig({
      ...localConfig,
      keywords: localConfig.keywords.filter(k => k !== keyword)
    });
  };

  const removeSource = (source: string) => {
    setLocalConfig({
      ...localConfig,
      sources: localConfig.sources.filter(s => s !== source)
    });
  };

  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customSourceName.trim() || !customSourceUrl.trim()) {
      setMessage('Please provide both a name and RSS URL for the custom source');
      return;
    }
    
    // Add the custom source to our registry
    if (addCustomNewsSource(customSourceName.trim(), customSourceUrl.trim())) {
      // Update available sources
      setAvailableSources(getAvailableNewsSources());
      
      // Add to local config
      setLocalConfig({
        ...localConfig,
        sources: [...localConfig.sources, customSourceName.trim()]
      });
      
      // Reset fields
      setCustomSourceName('');
      setCustomSourceUrl('');
      setMessage('Custom source added! Click Save & Update to refresh.');
    } else {
      setMessage('Source with this name already exists');
    }
  };

  const handleSaveChanges = () => {
    setMessage("Updating news feed...");
    onUpdate(localConfig);
    setTimeout(() => {
      setIsOpen(false);
      setMessage('');
    }, 1000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Settings2 size={18} />
        Manage Feeds
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-[#1e1e1e] rounded-lg shadow-xl p-6 z-10 border border-gray-800 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#e0e0e0]">Manage Your Feed</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-red-400"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2 text-[#e0e0e0]">Keywords</h4>
            <form onSubmit={addKeyword} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add new keyword..."
                className="flex-1 px-3 py-1 border border-gray-700 rounded-md bg-[#252525] text-[#e0e0e0] focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mb-2">
              {localConfig.keywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 bg-opacity-40 text-blue-300 rounded-full"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="hover:text-red-400 ml-1"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {localConfig.keywords.length === 0 && (
                <span className="text-gray-500 text-sm italic">No keywords added yet</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 p-2 bg-blue-900 bg-opacity-20 rounded-md border border-blue-900 border-opacity-30">
              <p className="font-medium text-blue-300">Smart Filtering:</p>
              <p>When you have both AI keywords (like "AI", "machine learning") AND graphics keywords (like "GPUs", "rendering"), articles must match at least one term from EACH category.</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2 text-[#e0e0e0]">Your News Sources</h4>
            
            {/* Multi-select source picker button */}
            <div className="mb-3">
              <button
                onClick={() => setShowSourceSelector(!showSourceSelector)}
                className="flex justify-between items-center w-full px-3 py-2 border border-gray-700 rounded-md bg-[#252525] text-[#e0e0e0] hover:bg-[#2a2a2a] transition-colors"
              >
                <span>{showSourceSelector ? 'Close Source Selector' : 'Add Sources'}</span>
                {showSourceSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {/* Source selector dropdown */}
              {showSourceSelector && (
                <div className="mt-2 border border-gray-700 rounded-md bg-[#1a1a1a] p-2 shadow-lg">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search sources..."
                      className="w-full px-3 py-1 border border-gray-700 rounded-md bg-[#252525] text-[#e0e0e0] focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto custom-scrollbar">
                    {filteredSources.length > 0 ? (
                      <div className="space-y-1">
                        {filteredSources.map(source => (
                          <div 
                            key={source}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-[#252525] rounded cursor-pointer"
                            onClick={() => toggleSourceSelection(source)}
                          >
                            <div className={`w-4 h-4 flex-shrink-0 border ${selectedSources.includes(source) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'} rounded flex items-center justify-center`}>
                              {selectedSources.includes(source) && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-sm text-gray-300">{source}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-2">
                        {searchTerm ? 'No matching sources found' : 'No additional sources available'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between">
                    <div className="text-xs text-blue-400">
                      {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected
                    </div>
                    <button
                      onClick={addSelectedSources}
                      disabled={selectedSources.length === 0}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
                    >
                      Add Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Current sources */}
            <div className="flex flex-wrap gap-2">
              {localConfig.sources.map(source => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-900 bg-opacity-30 text-green-300 rounded-full"
                >
                  {source}
                  <button
                    onClick={() => removeSource(source)}
                    className="hover:text-red-400 ml-1"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {localConfig.sources.length === 0 && (
                <span className="text-gray-500 text-sm italic">No sources selected yet</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2 text-[#e0e0e0]">Add Custom News Source</h4>
            <form onSubmit={handleAddCustomSource} className="space-y-2">
              <input
                type="text"
                value={customSourceName}
                onChange={(e) => setCustomSourceName(e.target.value)}
                placeholder="Source name (e.g. GPU World)"
                className="w-full px-3 py-1 border border-gray-700 rounded-md bg-[#252525] text-[#e0e0e0] focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={customSourceUrl}
                onChange={(e) => setCustomSourceUrl(e.target.value)}
                placeholder="RSS URL (e.g. https://example.com/feed)"
                className="w-full px-3 py-1 border border-gray-700 rounded-md bg-[#252525] text-[#e0e0e0] focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Custom Source
              </button>
            </form>
          </div>
          
          {message && (
            <div className="mb-4 text-sm bg-blue-900 bg-opacity-20 text-blue-300 px-3 py-2 rounded-md border border-blue-800">
              {message}
            </div>
          )}
          
          <button
            onClick={handleSaveChanges}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save & Update Feed
          </button>
        </div>
      )}
    </div>
  );
}