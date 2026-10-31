import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { api } from '../../services/api';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import Modal from '../../components/Modal';
import { 
  Shield, ShieldCheck, Lock, Sparkles, ArrowLeft, 
  CheckCircle2, AlertCircle, Bookmark, KeyRound
} from 'lucide-react';

const PROTECTION_TYPES = [
  { id: 'guardian_shield', name: 'Aegis Guardian Ward', desc: 'Adds permanent Questify protection tags and blocks bulk accidental cleanup', icon: ShieldCheck },
  { id: 'vault_label', name: 'High-Value Citadel Vault', desc: 'Applies priority security label in Gmail / Drive protection structure', icon: Lock },
  { id: 'read_only_marker', name: 'Immutable Memory Archive', desc: 'Marks document as read-only verified asset in digital health score', icon: Bookmark },
];

export default function GuardianWorld() {
  const { selectedItemsForGame, exitGameWorld, handleActionCompleted, showToast } = useGame();
  const { playClick, playScan, playApproval, playWarning } = useSound();

  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [protectedArtifacts, setProtectedArtifacts] = useState(new Set());
  const [protectionType, setProtectionType] = useState('guardian_shield');
  const [submitting, setSubmitting] = useState(false);

  const guardianItems = selectedItemsForGame;

  const handleInspectArtifact = (itemWithClass) => {
    playScan();
    setSelectedArtifact(itemWithClass);
  };

  const handleApproveProtection = async () => {
    if (!selectedArtifact) return;
    setSubmitting(true);
    playClick();

    try {
      // 1. Preview action
      const previewRes = await api.previewActions(
        [selectedArtifact.item.id],
        'protect_item',
        'Guardian Vault',
        null,
        `Shielded with ${protectionType}`
      );

      const actionId = previewRes.records[0].id;

      // 2. Explicit User Approval & Execution
      const batchResult = await api.approveActions([actionId]);

      if (batchResult.success) {
        setProtectedArtifacts(prev => new Set(prev).add(selectedArtifact.item.id));
        handleActionCompleted(batchResult);
        setSelectedArtifact(null);
      } else {
        playWarning();
        showToast("Guardian protection verification failed.", "error");
      }
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to activate guardian protection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Radiant Sapphire Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-blue-950/20 to-slate-950 pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 px-6 py-4 border-b border-indigo-900/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playClick();
              exitGameWorld();
            }}
            className="p-2 rounded-xl border border-indigo-800/40 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-lg font-extrabold font-cyber tracking-wider text-indigo-300">
              GUARDIAN REALM // CITADEL SHIELDS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Shielded Assets:</span>
          <span className="font-cyber font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/50">
            {protectedArtifacts.size} / {guardianItems.length} Protected
          </span>
        </div>
      </div>

      {/* Educational Awareness Disclaimer */}
      <div className="relative z-10 px-6 py-2.5 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-center text-xs text-indigo-300 gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400" />
        <span>
          Guardian Realm provides organizational digital shields and safeguards against accidental deletion. Always practice strong multi-factor authentication.
        </span>
      </div>

      {/* Grid of Selected Items for Protection */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {guardianItems.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-indigo-900/50">
              <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-200">The Guardian Vault is secure!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                No items currently selected for protection. Return to Dashboard, analyse your digital files, and choose personal memories or academic credentials.
              </p>
              <button
                onClick={exitGameWorld}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                Go to Analysis Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {guardianItems.map(itemWithClass => {
                const isShielded = protectedArtifacts.has(itemWithClass.item.id) || itemWithClass.item.is_protected;

                return (
                  <div
                    key={itemWithClass.item.id}
                    onClick={() => !isShielded && handleInspectArtifact(itemWithClass)}
                    className={`glass-panel rounded-2xl p-5 border relative overflow-hidden transition ${
                      isShielded 
                        ? 'border-indigo-500/60 bg-indigo-950/30 shadow-lg shadow-indigo-950/50' 
                        : 'glass-panel-hover border-slate-700 hover:border-indigo-400 cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-indigo-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-inner">
                        {isShielded ? '🛡️' : '📜'}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          isShielded 
                            ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}>
                          {isShielded ? 'Shield Active' : 'Unprotected'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {itemWithClass.item.file_type?.toUpperCase() || 'FILE'}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition mb-1">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ward Activation & Protection Modal */}
      {selectedArtifact && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedArtifact(null)}
          title={
            <div className="flex items-center gap-2 text-indigo-300 font-cyber">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Activate Guardian Ward // {selectedArtifact.item.title}</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
              <h4 className="font-bold text-sm text-slate-100 mb-1">
                {selectedArtifact.item.title}
              </h4>
              <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <strong>AI Explanation:</strong> {selectedArtifact.classification.explanation}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Protection Ward:
              </label>
              <div className="space-y-2">
                {PROTECTION_TYPES.map(p => {
                  const Icon = p.icon;
                  const isSelected = protectionType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setProtectionType(p.id);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                        isSelected 
                          ? 'border-indigo-400 bg-indigo-950/50 text-indigo-200 ring-2 ring-indigo-400/30' 
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedArtifact(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveProtection}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Anchoring Ward with Citadel...' : 'Approve & Shield Asset (+10 XP)'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
