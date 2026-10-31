import React, { useState } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { Edit3, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { id: 'promotional', label: 'Promotional / Marketing' },
  { id: 'academics', label: 'Academics / Notes / Syllabus' },
  { id: 'personal', label: 'Personal / Memories / Photos' },
  { id: 'professional', label: 'Professional / Career / Resume' },
  { id: 'financial', label: 'Financial / Statements / Taxes' },
  { id: 'otp_security', label: 'OTP & Authentication Codes' },
  { id: 'transactions', label: 'Transactions (UPI / Bank)' },
  { id: 'social', label: 'Social & Notifications' },
  { id: 'spam', label: 'Spam / Junk' },
  { id: 'fraud_phishing', label: 'Fraud / Phishing / Threat' },
  { id: 'important', label: 'Important / Urgent' },
  { id: 'attachments_documents', label: 'Attachments & Documents' },
  { id: 'other_unclassified', label: 'Other / Unclassified' },
];

export default function AICorrectionModal({ isOpen, onClose, itemWithClass, onUpdated }) {
  const { playClick, playApproval } = useSound();
  const [selectedCategory, setSelectedCategory] = useState(itemWithClass?.classification?.content_category || 'other_unclassified');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemWithClass) return;
    setSubmitting(true);
    setError('');

    try {
      playClick();
      const res = await api.correctClassification(
        itemWithClass.classification.id,
        selectedCategory,
        reason
      );
      playApproval();
      if (onUpdated) {
        onUpdated(res.classification);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit correction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!itemWithClass) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-cyan-400" />
          <span>Correct AI Classification</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <div className="font-semibold text-slate-200 truncate">{itemWithClass.item.title}</div>
          <div className="text-slate-400 mt-1">Current AI Category: <span className="text-cyan-300 font-mono">{itemWithClass.classification.content_category}</span></div>
          <div className="text-slate-400">Current Security: <span className="text-amber-300 font-mono">{itemWithClass.classification.security_status}</span></div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
            Select Correct Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
            Reason / Context (Optional feedback)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. This is university notes, not promotional material."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          />
          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>Your feedback is saved to your personal profile history for future classification preference.</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Apply Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
