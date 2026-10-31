import React from 'react';
import { ShieldCheck, ShieldAlert, HelpCircle, CheckCircle, Edit3 } from 'lucide-react';

export default function ConfidenceBadge({ securityStatus, category, confidence, confidenceLabel, isCorrected, onEdit }) {
  const getSecurityConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'authorised':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Authorised',
          classes: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        };
      case 'unauthorised':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Unauthorised / Suspicious',
          classes: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
        };
      case 'unverified':
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Unverified',
          classes: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        };
    }
  };

  const getConfidenceColor = (label) => {
    switch (label?.toLowerCase()) {
      case 'high':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
      case 'medium':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';
      default:
        return 'text-amber-400 border-amber-500/30 bg-amber-950/40';
    }
  };

  const sec = getSecurityConfig(securityStatus);
  const formattedCategory = (category || 'Other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Layer 1: Security & Trust Classification */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${sec.classes}`}>
        {sec.icon}
        <span>{sec.label}</span>
      </div>

      {/* Layer 2: Content Category */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700/60 bg-slate-800/60 text-slate-200 text-xs font-medium">
        <span>Category: {formattedCategory}</span>
        {isCorrected && (
          <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Corrected
          </span>
        )}
      </div>

      {/* AI Confidence Meter */}
      <div className={`px-2 py-0.5 rounded-full border text-[11px] font-mono ${getConfidenceColor(confidenceLabel)}`}>
        {Math.round((confidence || 0.8) * 100)}% ({confidenceLabel || 'Med'})
      </div>

      {/* Optional User Correction Button */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Correct AI Category"
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
