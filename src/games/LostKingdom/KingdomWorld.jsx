import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { api } from '../../services/api';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import Modal from '../../components/Modal';
import { 
  Crown, BookOpen, Heart, Briefcase, Coins, HelpCircle, 
  ArrowLeft, CheckCircle2, Sparkles, MapPin, Compass
} from 'lucide-react';

const CHESTS = [
  { id: 'University Library', name: 'Knowledge Chest', category: 'academics', icon: BookOpen, destination: 'University Library', color: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300' },
  { id: 'Memory Garden', name: 'Memory Chest', category: 'personal', icon: Heart, destination: 'Memory Garden', color: 'border-rose-500/60 bg-rose-950/40 text-rose-300' },
  { id: 'Royal Castle', name: 'Career Chest', category: 'professional', icon: Briefcase, destination: 'Royal Castle', color: 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300' },
  { id: 'Treasury Cave', name: 'Wealth Chest', category: 'financial', icon: Coins, destination: 'Treasury Cave', color: 'border-amber-500/60 bg-amber-950/40 text-amber-300' },
  { id: 'Mystery Forest', name: 'Mystery Chest', category: 'other_unclassified', icon: HelpCircle, destination: 'Mystery Forest', color: 'border-purple-500/60 bg-purple-950/40 text-purple-300' },
];

export default function KingdomWorld() {
  const { selectedItemsForGame, exitGameWorld, handleActionCompleted, showToast } = useGame();
  const { playClick, playScan, playApproval, playWarning } = useSound();

  const [selectedTreasure, setSelectedTreasure] = useState(null);
  const [sortedTreasures, setSortedTreasures] = useState(new Set());
  const [chosenDestination, setChosenDestination] = useState('University Library');
  const [submitting, setSubmitting] = useState(false);

  const kingdomItems = selectedItemsForGame;

  const handleOpenTreasure = (itemWithClass) => {
    playScan();
    setSelectedTreasure(itemWithClass);
    // Pre-select destination based on AI recommendation
    const cat = itemWithClass.classification.content_category?.toLowerCase();
    if (cat === 'academics') setChosenDestination('University Library');
    else if (cat === 'personal') setChosenDestination('Memory Garden');
    else if (cat === 'professional') setChosenDestination('Royal Castle');
    else if (cat === 'financial' || cat === 'transactions') setChosenDestination('Treasury Cave');
    else setChosenDestination('Mystery Forest');
  };

  const handleApproveOrganisation = async () => {
    if (!selectedTreasure) return;
    setSubmitting(true);
    playClick();

    try {
      // 1. Preview action
      const previewRes = await api.previewActions(
        [selectedTreasure.item.id],
        'organise_chest',
        chosenDestination,
        null,
        `Organised into ${chosenDestination} via Lost Kingdom`
      );

      const actionId = previewRes.records[0].id;

      // 2. Explicit User Approval & Execution
      const batchResult = await api.approveActions([actionId]);

      if (batchResult.success) {
        setSortedTreasures(prev => new Set(prev).add(selectedTreasure.item.id));
        handleActionCompleted(batchResult);
        setSelectedTreasure(null);
      } else {
        playWarning();
        showToast("Organisation verification failed. Please try again.", "error");
      }
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to organise treasure.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Golden Fantasy Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-yellow-950/10 to-slate-950 pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 px-6 py-4 border-b border-amber-900/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playClick();
              exitGameWorld();
            }}
            className="p-2 rounded-xl border border-amber-800/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
            <h1 className="text-lg font-extrabold font-fantasy tracking-wider text-amber-300">
              LOST KINGDOM // TREASURE ARCHIVES
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Treasures Unlocked:</span>
          <span className="font-cyber font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950 border border-amber-800/50">
            {sortedTreasures.size} / {kingdomItems.length} Sorted
          </span>
        </div>
      </div>

      {/* Dynamic Kingdom Treasure Map Overview */}
      <div className="relative z-10 px-6 py-4 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-fantasy font-bold text-amber-400">
            <Compass className="w-4 h-4" />
            <span>Kingdom Strongholds & Destination Chests</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {CHESTS.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium ${c.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid of Selected Files as Unsorted Treasures */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {kingdomItems.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-amber-900/50">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-200">The Royal Archives are currently organized!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                No items selected for kingdom sorting. Return to Dashboard, analyse Google Drive or Gmail, and select academic or personal documents.
              </p>
              <button
                onClick={exitGameWorld}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition"
              >
                Go to Analysis Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kingdomItems.map(itemWithClass => {
                const isSorted = sortedTreasures.has(itemWithClass.item.id);
                return (
                  <div
                    key={itemWithClass.item.id}
                    onClick={() => !isSorted && handleOpenTreasure(itemWithClass)}
                    className={`glass-panel rounded-2xl p-5 border relative overflow-hidden transition ${
                      isSorted 
                        ? 'opacity-60 border-emerald-500/50 bg-emerald-950/20 cursor-default' 
                        : 'glass-panel-hover border-amber-500/40 bg-amber-950/30 hover:border-amber-400 cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-amber-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-inner">
                        {isSorted ? '🗝️' : '📦'}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          isSorted 
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
                            : 'bg-amber-950 border-amber-500/40 text-amber-300'
                        }`}>
                          {isSorted ? 'Secured in Vault' : 'Unsorted Treasure'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {itemWithClass.item.file_type?.toUpperCase() || 'DOCUMENT'}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-amber-300 transition mb-1">
                      {itemWithClass.item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {itemWithClass.item.snippet || 'No document preview available.'}
                    </p>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <ConfidenceBadge
                        securityStatus={itemWithClass.classification.security_status}
                        category={itemWithClass.classification.content_category}
                        confidence={itemWithClass.classification.confidence}
                        confidenceLabel={itemWithClass.classification.confidence_label}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sorting & Destination Selection Modal */}
      {selectedTreasure && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTreasure(null)}
          title={
            <div className="flex items-center gap-2 text-amber-300 font-fantasy">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Kingdom Sorter // {selectedTreasure.item.title}</span>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Treasure File Summary */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <h4 className="font-bold text-sm text-slate-100 mb-1">
                {selectedTreasure.item.title}
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                Origin: {selectedTreasure.item.original_location || 'Root'}
              </p>
              <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <strong>AI Recommendation:</strong> {selectedTreasure.classification.explanation}
              </div>
            </div>

            {/* Destination Chest Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-fantasy">
                Choose Kingdom Stronghold Destination:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHESTS.map(c => {
                  const Icon = c.icon;
                  const isSelected = chosenDestination === c.destination;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setChosenDestination(c.destination);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                        isSelected 
                          ? `${c.color} border-amber-400 ring-2 ring-amber-400/30 shadow-lg` 
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{c.name}</div>
                        <div className="text-[10px] text-slate-400">Vault: {c.destination}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTreasure(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveOrganisation}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Verifying with Kingdom Vault...' : `Approve & Place in ${chosenDestination} (+10 XP)`}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
