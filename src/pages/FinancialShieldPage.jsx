import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { 
  ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, ArrowUpRight, 
  ArrowDownLeft, Building2, UserX, CheckCircle2, HelpCircle, 
  RefreshCw, Lock, Sparkles, MessageSquare
} from 'lucide-react';

const BANKS = [
  'All Banks', 'SBI', 'HDFC', 'ICICI', 'Axis Bank', 'PNB', 'Bank of Baroda', 'Other'
];

export default function FinancialShieldPage() {
  const { playClick, playScan, playApproval, playWarning } = useSound();
  const { showToast } = useGame();

  const [selectedBank, setSelectedBank] = useState('All Banks');
  const [shieldData, setShieldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingItem, setReviewingItem] = useState(null);

  const fetchShield = async (bank) => {
    setLoading(true);
    try {
      const data = await api.getFinancialShield(bank === 'All Banks' ? null : bank);
      setShieldData(data);
    } catch (err) {
      showToast(err.message || "Failed to load Financial Shield.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShield(selectedBank);
  }, [selectedBank]);

  const handleBankChange = (b) => {
    playClick();
    setSelectedBank(b);
  };

  const handleReviewOTP = async (itemId, state) => {
    playClick();
    try {
      await api.reviewFinancialItem(itemId, state, `User confirmed OTP as ${state}`);
      playApproval();
      showToast(`OTP updated as ${state.toUpperCase()}`, 'success');
      fetchShield(selectedBank);
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to update OTP review.", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              FINANCIAL SHIELD // SMS & BANKING INTELLIGENCE
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real-time heuristic analysis for banking SMS, transaction notifications, OTP verifications, and impersonation threats. Protects against unknown-payer scams and fake electricity/KYC frauds.
          </p>
        </div>

        {/* Bank Recognition Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBank}
            onChange={(e) => handleBankChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
          >
            {BANKS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Security & Privacy Rule Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-100">Zero Confidential Credential Policy:</strong> Questify AI will <strong>NEVER</strong> ask you for your OTP, UPI PIN, CVV, Card Number, or NetBanking password. OTPs are generated on bank servers, not phones; always verify transfer amounts before approval.
        </div>
      </div>

      {loading || !shieldData ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-cyber text-slate-400">Loading Banking Intelligence...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: OTP & Security Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>One-Time Password (OTP) Intelligence ({shieldData.otps.length})</span>
              </h2>
              <span className="text-xs text-slate-400">
                Categorized by requested context
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shieldData.otps.map(msg => {
                const subType = msg.financial_sub_type;
                const isUnexpected = subType === 'otp_unexpected';

                return (
                  <div
                    key={msg.item.id}
                    className={`glass-panel rounded-2xl p-5 border relative ${
                      isUnexpected 
                        ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase px-2 py-0.5 rounded bg-slate-800">
                        {msg.bank_name || 'Bank'} // {msg.item.sender_id || 'SMS'}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                        isUnexpected 
                          ? 'border-rose-500 bg-rose-950 text-rose-300' 
                          : 'border-cyan-500 bg-cyan-950 text-cyan-300'
                      }`}>
                        {subType?.replace('otp_', '').toUpperCase() || 'UNVERIFIED'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 mb-1">{msg.item.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{msg.item.snippet}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Did you initiate this request?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewOTP(msg.item.id, 'expected')}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition"
                        >
                          Yes, Expected
                        </button>
                        <button
                          onClick={() => handleReviewOTP(msg.item.id, 'unexpected')}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition"
                        >
                          No, Unexpected!
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Transactions (Incoming Credits & Unknown Payers) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                <span>Transaction Streams ({shieldData.transactions.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shieldData.transactions.map(msg => (
                <div key={msg.item.id} className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/40">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase px-2 py-0.5 rounded bg-slate-800">
                      {msg.bank_name || 'Bank'}
                    </span>
                    <ConfidenceBadge
                      securityStatus={msg.classification.security_status}
                      category={msg.classification.content_category}
                      confidence={msg.classification.confidence}
                      confidenceLabel={msg.classification.confidence_label}
                    />
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 mb-1">{msg.item.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">{msg.item.snippet}</p>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                    <strong>Heuristic Reasoning:</strong> {msg.classification.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Sender Intelligence Profiles */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Sender Intelligence Registry ({shieldData.senders.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shieldData.senders.map(sp => (
                <div key={sp.id} className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-100">{sp.sender_identifier}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                      sp.trust_status === 'trusted' 
                        ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300' 
                        : sp.trust_status === 'suspicious' 
                        ? 'border-rose-500/40 bg-rose-950 text-rose-300' 
                        : 'border-amber-500/40 bg-amber-950 text-amber-300'
                    }`}>
                      {sp.trust_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Association: <strong className="text-slate-200">{sp.bank_association || 'General'}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Trust Score:</span>
                    <span className="font-mono font-bold text-cyan-300">{sp.trust_score} / 100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
