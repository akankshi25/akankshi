import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSound } from '../../context/SoundContext';
import { api } from '../../services/api';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import Modal from '../../components/Modal';
import { 
  Search, ShieldAlert, FileSearch, AlertTriangle, ArrowLeft, 
  CheckCircle2, HelpCircle, ExternalLink, ShieldCheck, Fingerprint
} from 'lucide-react';

const VERDICTS = [
  { id: 'possible_phishing', label: 'Possible Phishing / Malicious', desc: 'Impersonates authentic brands or contains deceptive credentials harvest links', color: 'border-rose-500/70 bg-rose-950/40 text-rose-300' },
  { id: 'suspicious', label: 'Suspicious / High Caution', desc: 'Contains questionable urgency markers or unverified sender domains', color: 'border-amber-500/70 bg-amber-950/40 text-amber-300' },
  { id: 'unverified', label: 'Unverified / Insufficient Evidence', desc: 'Cannot confirm threat nor authenticity; retain message for further monitoring', color: 'border-cyan-500/70 bg-cyan-950/40 text-cyan-300' },
  { id: 'likely_safe', label: 'Likely Safe / False Alarm', desc: 'Legitimate transaction notice or approved contact with benign content', color: 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300' },
];

export default function DetectiveWorld() {
  const { selectedItemsForGame, exitGameWorld, handleActionCompleted, showToast } = useGame();
  const { playClick, playScan, playApproval, playWarning } = useSound();

  const [selectedCase, setSelectedCase] = useState(null);
  const [closedCases, setClosedCases] = useState(new Set());
  const [chosenVerdict, setChosenVerdict] = useState('possible_phishing');
  const [investigatorNotes, setInvestigatorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const detectiveItems = selectedItemsForGame;

  const handleOpenCaseFile = (itemWithClass) => {
    playScan();
    setSelectedCase(itemWithClass);
    // Suggest initial verdict based on AI analysis
    const sec = itemWithClass.classification.security_status?.toLowerCase();
    if (sec === 'unauthorised') setChosenVerdict('possible_phishing');
    else if (sec === 'unverified') setChosenVerdict('unverified');
    else setChosenVerdict('likely_safe');
  };

  const handleCloseCaseVerdict = async () => {
    if (!selectedCase) return;
    setSubmitting(true);
    playClick();

    try {
      // 1. Preview action
      const previewRes = await api.previewActions(
        [selectedCase.item.id],
        'submit_verdict',
        'Case Archives',
        chosenVerdict,
        investigatorNotes || 'Verdict rendered by Scam Detective'
      );

      const actionId = previewRes.records[0].id;

      // 2. Explicit User Approval & Execution
      const batchResult = await api.approveActions([actionId]);

      if (batchResult.success) {
        setClosedCases(prev => new Set(prev).add(selectedCase.item.id));
        handleActionCompleted(batchResult);
        setSelectedCase(null);
        setInvestigatorNotes('');
      } else {
        playWarning();
        showToast("Investigation verdict verification failed.", "error");
      }
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to record case verdict.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dark Purple Neon Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 px-6 py-4 border-b border-purple-900/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playClick();
              exitGameWorld();
            }}
            className="p-2 rounded-xl border border-purple-800/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-lg font-extrabold font-cyber tracking-wider text-purple-300">
              SCAM DETECTIVE // INCIDENT BOARD
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Investigations Closed:</span>
          <span className="font-cyber font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950 border border-purple-800/50">
            {closedCases.size} / {detectiveItems.length} Resolved
          </span>
        </div>
      </div>

      {/* Legal & Investigative Disclaimer */}
      <div className="relative z-10 px-6 py-2.5 bg-purple-950/30 border-b border-purple-900/30 flex items-center justify-center text-xs text-purple-300 gap-2">
        <Fingerprint className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          Never claim a conclusive cybercrime without definitive digital forensic proof. Retain suspicious messages for legal or bank evidence.
        </span>
      </div>

      {/* Case Board Grid */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {detectiveItems.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-purple-900/50">
              <Search className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-200">No active suspect case files!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                All incident queues are clear. Return to Dashboard, analyse emails or SMS, and flag suspicious alerts for investigation.
              </p>
              <button
                onClick={exitGameWorld}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition"
              >
                Go to Analysis Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {detectiveItems.map(itemWithClass => {
                const isClosed = closedCases.has(itemWithClass.item.id);

                return (
                  <div
                    key={itemWithClass.item.id}
                    onClick={() => !isClosed && handleOpenCaseFile(itemWithClass)}
                    className={`glass-panel rounded-2xl p-5 border relative overflow-hidden transition ${
                      isClosed 
                        ? 'border-emerald-500/50 bg-emerald-950/20 opacity-70 cursor-default' 
                        : 'glass-panel-hover border-purple-500/40 bg-purple-950/30 hover:border-purple-400 cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-purple-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-inner">
                        {isClosed ? '📁' : '🕵️‍♂️'}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          isClosed 
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
                            : 'bg-purple-950 border-purple-500/40 text-purple-300'
                        }`}>
                          {isClosed ? 'Verdict Recorded' : 'Open Case File'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {itemWithClass.item.source.toUpperCase()} // ALERT
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-purple-300 transition mb-1">
                      {itemWithClass.item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {itemWithClass.item.snippet || 'No body text extracted.'}
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

      {/* Case File Investigation Modal */}
      {selectedCase && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCase(null)}
          title={
            <div className="flex items-center gap-2 text-purple-300 font-cyber">
              <FileSearch className="w-5 h-5 text-purple-400" />
              <span>Case File Examination // {selectedCase.item.title}</span>
            </div>
          }
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Clue Card 1: Sender & Metadata */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40">
              <div className="text-xs font-mono font-bold text-purple-400 uppercase mb-1">
                Clue 1: Origin & Identity Analysis
              </div>
              <div className="text-sm font-bold text-slate-100 mb-1">{selectedCase.item.title}</div>
              <div className="text-xs text-slate-300">
                Sender: <span className="font-mono text-cyan-300">{selectedCase.item.sender || 'Unknown'}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Sender ID / Address: <span className="font-mono">{selectedCase.item.sender_id || 'N/A'}</span>
              </div>
            </div>

            {/* Clue Card 2: AI Threat Diagnostics */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">
                Clue 2: AI Heuristic & Linguistic Findings
              </div>
              <ConfidenceBadge
                securityStatus={selectedCase.classification.security_status}
                category={selectedCase.classification.content_category}
                confidence={selectedCase.classification.confidence}
                confidenceLabel={selectedCase.classification.confidence_label}
              />
              <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 mt-2">
                <strong>Forensic Note:</strong> {selectedCase.classification.explanation}
              </p>
            </div>

            {/* Clue Card 3: Untrusted Content Preview */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                Clue 3: Extracted Untrusted Content
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {selectedCase.item.snippet}
              </div>
            </div>

            {/* Verdict Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-cyber">
                Select Investigator Verdict:
              </label>
              <div className="space-y-2">
                {VERDICTS.map(v => {
                  const isSelected = chosenVerdict === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setChosenVerdict(v.id);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                        isSelected 
                          ? `${v.color} ring-2 ring-purple-400/30` 
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold">{v.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Investigator Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Investigator Case Notes (Optional):
              </label>
              <input
                type="text"
                value={investigatorNotes}
                onChange={(e) => setInvestigatorNotes(e.target.value)}
                placeholder="e.g. Domain .xyz is unverified. Bank confirms no KYC request was sent."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseCaseVerdict}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Recording Case Verdict...' : 'Close Case File (+15 XP)'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
