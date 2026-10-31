import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { api } from '../services/api';
import ConfidenceBadge from '../components/ConfidenceBadge';
import AICorrectionModal from '../components/AICorrectionModal';
import { 
  Sparkles, Filter, CheckSquare, Square, Play, 
  Waves, Crown, Shield, Search, ArrowRight, RefreshCw, 
  HelpCircle, AlertTriangle, Mail, HardDrive, MessageSquare
} from 'lucide-react';

export default function AnalysisResultsPage() {
  const { 
    activeSource, setActiveSource, launchGameWithSelectedItems, showToast 
  } = useGame();
  const { playClick, playScan, playApproval } = useSound();

  const [itemsWithClass, setItemsWithClass] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [securityFilter, setSecurityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);

  const fetchResults = async (source) => {
    setLoading(true);
    try {
      const res = await api.getAnalysisResults(source);
      setItemsWithClass(res.results);
      setSelectedIds(new Set());
    } catch (err) {
      showToast(err.message || "Failed to load analysis results.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(activeSource);
  }, [activeSource]);

  const handleSourceChange = (src) => {
    playClick();
    setActiveSource(src);
  };

  const handleSelectAll = () => {
    playClick();
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.item.id)));
    }
  };

  const toggleSelectItem = (id) => {
    playClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLaunchGame = (gameWorld) => {
    const selectedObjects = itemsWithClass.filter(i => selectedIds.has(i.item.id));
    if (selectedObjects.length === 0) {
      showToast("Please check at least one digital item to begin the quest.", "warning");
      return;
    }
    playApproval();
    launchGameWithSelectedItems(gameWorld, selectedObjects);
  };

  // Filter items
  const filteredItems = itemsWithClass.filter(itemWithClass => {
    const sec = itemWithClass.classification.security_status?.toLowerCase();
    const cat = itemWithClass.classification.content_category?.toLowerCase();

    if (securityFilter !== 'all' && sec !== securityFilter) return false;
    if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Source Switcher */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              AI CLASSIFICATION & REVIEW QUEUE
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Independent 2-Layer AI Analysis: Security & Trust verification is performed first, followed by content category determination. Review items below and launch the relevant game quest.
          </p>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => handleSourceChange('gmail')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSource === 'gmail' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail</span>
          </button>

          <button
            onClick={() => handleSourceChange('drive')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSource === 'drive' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>

          <button
            onClick={() => handleSourceChange('messages')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSource === 'messages' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
          </button>
        </div>
      </div>

      {/* Action Quest Launcher Bar */}
      <div className="sticky top-20 z-20 glass-panel rounded-2xl p-4 border border-cyan-500/30 shadow-xl bg-slate-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800/60"
          >
            {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({selectedIds.size} chosen)</span>
          </button>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400 font-mono">
            {filteredItems.length} items shown
          </span>
        </div>

        {/* 4 Connected Game Action Launchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Ocean Explorer (Deletion) */}
          <button
            onClick={() => handleLaunchGame('ocean_explorer')}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              selectedIds.size > 0 
                ? 'btn-ocean cursor-pointer' 
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Clean in Ocean Explorer</span>
          </button>

          {/* 2. Lost Kingdom (Organisation) */}
          <button
            onClick={() => handleLaunchGame('lost_kingdom')}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              selectedIds.size > 0 
                ? 'btn-kingdom cursor-pointer' 
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Sort in Lost Kingdom</span>
          </button>

          {/* 3. Guardian Realm (Protection) */}
          <button
            onClick={() => handleLaunchGame('guardian_realm')}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              selectedIds.size > 0 
                ? 'btn-guardian cursor-pointer' 
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Protect in Guardian Realm</span>
          </button>

          {/* 4. Scam Detective (Investigation) */}
          <button
            onClick={() => handleLaunchGame('scam_detective')}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              selectedIds.size > 0 
                ? 'btn-detective cursor-pointer' 
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Investigate in Detective</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Security:
        </span>
        {['all', 'authorised', 'unauthorised', 'unverified'].map(s => (
          <button
            key={s}
            onClick={() => setSecurityFilter(s)}
            className={`px-3 py-1 rounded-full border transition uppercase text-[11px] font-semibold ${
              securityFilter === s 
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <span className="text-slate-400 font-semibold">Category:</span>
        {['all', 'promotional', 'academics', 'personal', 'professional', 'financial', 'fraud_phishing', 'otp_security'].map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1 rounded-full border transition capitalize text-[11px] font-semibold ${
              categoryFilter === c 
                ? 'bg-indigo-950 border-indigo-400 text-indigo-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-cyber text-slate-400">Classifying digital records with AI...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border-slate-800 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No items match your filter selection</h3>
          <p className="text-xs text-slate-400">Try clearing security or category filters above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(itemWithClass => {
            const isSelected = selectedIds.has(itemWithClass.item.id);

            return (
              <div
                key={itemWithClass.item.id}
                onClick={() => toggleSelectItem(itemWithClass.item.id)}
                className={`glass-panel rounded-2xl p-5 border cursor-pointer transition relative overflow-hidden ${
                  isSelected 
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30' 
                    : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div className="pt-1">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 shrink-0 hover:text-slate-300" />
                    )}
                  </div>

                  {/* Main Record Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {itemWithClass.item.source}
                        </span>
                        <span className="text-xs text-slate-400">
                          {itemWithClass.item.date_str}
                        </span>
                        {itemWithClass.item.is_protected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-950 text-indigo-300 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Protected
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        {itemWithClass.item.size_bytes > 0 && `${Math.round(itemWithClass.item.size_bytes / 1024)} KB`}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 break-words">
                      {itemWithClass.item.title}
                    </h3>

                    <div className="text-xs text-slate-400 truncate">
                      Origin: <span className="text-slate-300">{itemWithClass.item.sender || 'Unknown'}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {itemWithClass.item.snippet || 'No body content available.'}
                    </p>

                    {/* AI 2-Layer Badges + Explanation */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                      <ConfidenceBadge
                        securityStatus={itemWithClass.classification.security_status}
                        category={itemWithClass.classification.content_category}
                        confidence={itemWithClass.classification.confidence}
                        confidenceLabel={itemWithClass.classification.confidence_label}
                        isCorrected={itemWithClass.classification.is_user_corrected}
                        onEdit={() => setEditingItem(itemWithClass)}
                      />

                      <div className="text-[11px] text-slate-400 font-medium">
                        Suggested: <span className="text-cyan-300 uppercase font-bold">{itemWithClass.classification.recommended_action}</span> // Game: <span className="text-amber-300 uppercase font-bold">{itemWithClass.classification.game?.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <strong>AI Explanation:</strong> {itemWithClass.classification.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Category Correction Modal */}
      {editingItem && (
        <AICorrectionModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          itemWithClass={editingItem}
          onUpdated={(updatedClassification) => {
            setItemsWithClass(prev => prev.map(item => {
              if (item.classification.id === updatedClassification.id) {
                return { ...item, classification: updatedClassification };
              }
              return item;
            }));
            showToast("Classification category corrected and saved to profile history.", "success");
          }}
        />
      )}
    </div>
  );
}
