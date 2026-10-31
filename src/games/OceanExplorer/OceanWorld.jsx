import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { api } from '../../services/api';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import Modal from '../../components/Modal';
import { 
  Waves, Shield, Trash2, CheckCircle2, AlertTriangle, 
  ArrowLeft, Crosshair, Sparkles, RefreshCw, Eye
} from 'lucide-react';

const REGIONS = [
  { id: 'coral_reef', name: 'Coral Reef', desc: 'Lightweight clutter & daily subscriptions', color: 'from-teal-900 to-cyan-900' },
  { id: 'deep_ocean', name: 'Deep Ocean', desc: 'Heavy archives & storage consumers', color: 'from-blue-950 to-indigo-950' },
  { id: 'dark_abyss', name: 'Dark Abyss', desc: 'Suspicious downloads & high threat targets', color: 'from-slate-950 to-purple-950' },
  { id: 'sunken_treasure', name: 'Sunken Treasure', desc: 'Recoverable items & protected relics', color: 'from-amber-950 to-cyan-950' },
];

export default function OceanWorld() {
  const { selectedItemsForGame, exitGameWorld, handleActionCompleted, showToast } = useGame();
  const { playClick, playScan, playApproval, playWarning } = useSound();

  const [activeRegion, setActiveRegion] = useState('coral_reef');
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [defeatedCreatures, setDefeatedCreatures] = useState(new Set());
  const [executingAction, setExecutingAction] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  // Filter items assigned to this game or current selection
  const oceanItems = selectedItemsForGame;

  const getCreatureIcon = (creatureType, category) => {
    switch (creatureType?.toLowerCase()) {
      case 'monster_shark':
      case 'shark':
        return { emoji: '🦈', name: 'Monster Shark', role: 'Clutter Target', bg: 'border-cyan-500/50 bg-cyan-950/60' };
      case 'dolphin':
        return { emoji: '🐬', name: 'Sage Dolphin', role: 'Academic Knowledge', bg: 'border-emerald-500/50 bg-emerald-950/60' };
      case 'fish':
        return { emoji: '🐠', name: 'Reef Memory Fish', role: 'Personal Asset', bg: 'border-teal-500/50 bg-teal-950/60' };
      case 'octopus':
        return { emoji: '🐙', name: 'Promo Octopus', role: 'Promotional Content', bg: 'border-purple-500/50 bg-purple-950/60' };
      case 'sea_serpent':
      case 'eel':
        return { emoji: '🐍', name: 'Abyss Serpent', role: 'Suspicious Target', bg: 'border-rose-500/50 bg-rose-950/60' };
      case 'jellyfish':
        return { emoji: '🪼', name: 'Phantom Jellyfish', role: 'Expired Cache', bg: 'border-indigo-500/50 bg-indigo-950/60' };
      default:
        return { emoji: '🦑', name: 'Deep Entity', role: 'Unclassified Item', bg: 'border-slate-500/50 bg-slate-900/60' };
    }
  };

  const handleCreatureClick = (itemWithClass) => {
    playScan();
    setSelectedCreature(itemWithClass);
    setWarningAcknowledged(false);
  };

  const handleApproveDeletion = async () => {
    if (!selectedCreature) return;
    const isProtected = selectedCreature.item.is_protected;

    if (isProtected && !warningAcknowledged) {
      playWarning();
      showToast("Warning: This item is protected! Please check the explicit confirmation checkbox.", "warning");
      return;
    }

    setExecutingAction(true);
    playClick();

    try {
      // 1. Preview action
      const previewRes = await api.previewActions(
        [selectedCreature.item.id],
        'move_to_trash',
        'Central Trash',
        null,
        'Approved by user in Ocean Explorer'
      );

      const actionId = previewRes.records[0].id;

      // 2. Explicit User Approval & Execution
      const batchResult = await api.approveActions([actionId]);

      if (batchResult.success) {
        // Creature disappears ONLY after backend verification succeeds!
        setDefeatedCreatures(prev => new Set(prev).add(selectedCreature.item.id));
        handleActionCompleted(batchResult);
        setSelectedCreature(null);
      } else {
        playWarning();
        showToast("Backend verification failed. Creature remains active.", "error");
      }
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to execute cleanup action.", "error");
    } finally {
      setExecutingAction(false);
    }
  };

  const handleKeepItem = () => {
    playClick();
    showToast(`Preserved '${selectedCreature?.item?.title}'. Creature spared!`, 'info');
    setSelectedCreature(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Undersea Ambient Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/30 via-blue-950/40 to-slate-950 pointer-events-none" />
      
      {/* Floating Bubbles */}
      <div className="bubble-particle w-3 h-3 left-[10%] bottom-0 opacity-40 animate-bubble-rise" />
      <div className="bubble-particle w-5 h-5 left-[25%] bottom-0 opacity-60 animate-bubble-rise" style={{ animationDelay: '1.5s' }} />
      <div className="bubble-particle w-4 h-4 left-[60%] bottom-0 opacity-50 animate-bubble-rise" style={{ animationDelay: '3s' }} />
      <div className="bubble-particle w-2 h-2 left-[85%] bottom-0 opacity-40 animate-bubble-rise" style={{ animationDelay: '2s' }} />

      {/* Top Game Bar */}
      <div className="relative z-10 px-6 py-4 border-b border-cyan-900/40 bg-slate-950/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playClick();
              exitGameWorld();
            }}
            className="p-2 rounded-xl border border-cyan-800/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-lg font-extrabold font-cyber tracking-wider text-cyan-300">
              OCEAN EXPLORER
            </h1>
            <span className="text-xs text-cyan-500 font-mono hidden sm:inline">
              // Digital Cleanup & Marine Deletion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Selected Targets:</span>
          <span className="font-cyber font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/50">
            {oceanItems.filter(i => !defeatedCreatures.has(i.item.id)).length} Active
          </span>
          <span className="font-cyber font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/50">
            {defeatedCreatures.size} Salvaged
          </span>
        </div>
      </div>

      {/* Region Selector Tabs */}
      <div className="relative z-10 px-6 py-3 border-b border-slate-900 bg-slate-950/50 flex items-center gap-2 overflow-x-auto">
        {REGIONS.map(reg => (
          <button
            key={reg.id}
            onClick={() => {
              playClick();
              setActiveRegion(reg.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
              activeRegion === reg.id
                ? 'bg-cyan-900/70 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-900/40'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{reg.name}</span>
          </button>
        ))}
      </div>

      {/* Undersea Grid of Creatures linked to Real Selected Digital Items */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {oceanItems.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-cyan-900/50">
              <Waves className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-60 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-200">The ocean waters are serene and clean!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                No items selected for cleanup. Return to Dashboard, analyse Gmail or Drive, and select digital clutter candidates.
              </p>
              <button
                onClick={exitGameWorld}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition"
              >
                Go to Analysis Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {oceanItems.map(itemWithClass => {
                const isDefeated = defeatedCreatures.has(itemWithClass.item.id);
                if (isDefeated) return null; // Creature disappeared after verification!

                const info = getCreatureIcon(
                  itemWithClass.classification.creature_or_element,
                  itemWithClass.classification.content_category
                );

                return (
                  <div
                    key={itemWithClass.item.id}
                    onClick={() => handleCreatureClick(itemWithClass)}
                    className={`glass-panel glass-panel-hover rounded-2xl p-5 border cursor-pointer relative overflow-hidden group transition ${info.bg}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-inner">
                        {info.emoji}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
                          {info.role}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {itemWithClass.item.source.toUpperCase()} // {itemWithClass.item.file_type || 'file'}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-cyan-300 transition mb-1">
                      {itemWithClass.item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {itemWithClass.item.snippet || 'No preview available.'}
                    </p>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <ConfidenceBadge
                        securityStatus={itemWithClass.classification.security_status}
                        category={itemWithClass.classification.content_category}
                        confidence={itemWithClass.classification.confidence}
                        confidenceLabel={itemWithClass.classification.confidence_label}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-end text-[11px] text-cyan-400 font-semibold gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Engage Scanner</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Deep Scanner & Action Approval Modal */}
      {selectedCreature && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCreature(null)}
          title={
            <div className="flex items-center gap-2 text-cyan-300 font-cyber">
              <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Bio-Scanner // {getCreatureIcon(selectedCreature.classification.creature_or_element).name}</span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Creature & Record Header */}
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex items-start gap-4">
              <div className="text-4xl p-2 bg-slate-900 rounded-xl border border-cyan-700/40">
                {getCreatureIcon(selectedCreature.classification.creature_or_element).emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-600/40">
                    Source: {selectedCreature.item.source.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedCreature.item.date_str}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-100 leading-snug break-words">
                  {selectedCreature.item.title}
                </h4>
                <div className="text-xs text-slate-400 mt-1">
                  Sender / Origin: <span className="text-slate-300">{selectedCreature.item.sender || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* AI 2-Layer Classification Reasoning */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>AI Deep Scanner Analysis</span>
                <span className="text-cyan-400">Independent 2-Layer Validation</span>
              </div>
              <ConfidenceBadge
                securityStatus={selectedCreature.classification.security_status}
                category={selectedCreature.classification.content_category}
                confidence={selectedCreature.classification.confidence}
                confidenceLabel={selectedCreature.classification.confidence_label}
              />
              <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                <strong>AI Explanation:</strong> {selectedCreature.classification.explanation}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Suggested Action: <strong className="text-amber-300 uppercase">{selectedCreature.classification.recommended_action}</strong></span>
                <span>Reward Potential: <strong className="text-emerald-400 font-mono">+10 XP</strong></span>
              </div>
            </div>

            {/* Safeguard Warning if Protected Item */}
            {selectedCreature.item.is_protected && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>PROTECTED ITEM WARNING</span>
                </div>
                <p className="text-xs text-rose-200">
                  This item has been flagged as a protected personal/academic record. Deleting it will bypass your active guardian shields.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={warningAcknowledged}
                    onChange={(e) => setWarningAcknowledged(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    I explicitly confirm and accept moving this protected item to Central Trash.
                  </span>
                </label>
              </div>
            )}

            {/* Approval Decision Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleKeepItem}
                disabled={executingAction}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Keep Item (Spare Creature)</span>
              </button>

              <button
                type="button"
                onClick={handleApproveDeletion}
                disabled={executingAction || (selectedCreature.item.is_protected && !warningAcknowledged)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  selectedCreature.item.is_protected && !warningAcknowledged
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{executingAction ? 'Verifying with Backend...' : 'Approve & Move to Trash (+10 XP)'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
