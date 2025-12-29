import React, { useState } from 'react';
import { Plus, Trash2, Save, Hash, MessageSquare, Tag } from 'lucide-react';
import { KnowledgeEntry } from '../types';
import { deleteKnowledgeEntry, addKnowledgeEntry } from '../services/firebase';

interface TrainingPanelProps {
  entries: KnowledgeEntry[];
  isConnected: boolean;
}

const TrainingPanel: React.FC<TrainingPanelProps> = ({ entries, isConnected }) => {
  const [newTopic, setNewTopic] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newTopic || !newKeywords || !newResponse) return;
    setIsSubmitting(true);
    
    try {
      const keywordsArray = newKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      await addKnowledgeEntry({
        topic: newTopic,
        keywords: keywordsArray,
        response: newResponse
      });

      setNewTopic('');
      setNewKeywords('');
      setNewResponse('');
    } catch (err) {
      console.error("Failed to add entry", err);
      alert("Failed to save to Firebase. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
      if(!id) return;
      if(window.confirm("Are you sure you want to delete this knowledge entry?")) {
          try {
              await deleteKnowledgeEntry(id);
          } catch(err) {
              console.error("Failed to delete", err);
          }
      }
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
        <Hash size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-300">Database Disconnected</h3>
        <p className="max-w-xs mx-auto mt-2">Connect to Firebase in settings to start training your AI model.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-800/50 overflow-hidden">
      {/* Add New Section */}
      <div className="p-6 border-b border-gray-700 bg-gray-800 shadow-md z-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="text-blue-400" size={20} />
          Add Knowledge
        </h2>
        
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Topic / Category</label>
             <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Pricing, Greeting, Technical Support"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
             </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Trigger Keywords (comma separated)</label>
             <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="e.g. hello, hi, how much, cost, price"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
             </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Bot Response</label>
             <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-500" size={16} />
                <textarea 
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="The text the bot should reply with..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 h-24 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
             </div>
          </div>

          <button 
            onClick={handleAdd}
            disabled={isSubmitting || !newTopic || !newResponse}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Save size={18} />
                Save to Database
              </>
            )}
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Current Knowledge Base ({entries.length})</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">
              No knowledge entries yet. Add some above!
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block px-2 py-1 bg-gray-700 rounded text-xs font-mono text-blue-300">
                    {entry.topic}
                  </span>
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {entry.keywords.map((k, i) => (
                      <span key={i} className="text-xs text-gray-300 bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-700">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Response:</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{entry.response}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingPanel;