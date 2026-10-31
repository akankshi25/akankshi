import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, FolderCheck, Trash2, ArrowUpRight } from 'lucide-react';

export default function DigitalHealthScore({ health }) {
  if (!health) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500';
    if (score >= 50) return 'text-cyan-400 border-cyan-500';
    return 'text-amber-400 border-amber-500';
  };

  const getScoreBadgeBg = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (score >= 50) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Overall Circular Score */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Circular Ring SVG */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * health.overall_score) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${
                  health.overall_score >= 80 ? 'text-emerald-500' : health.overall_score >= 50 ? 'text-cyan-500' : 'text-amber-500'
                }`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black font-cyber text-slate-100">
                {health.overall_score}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Score
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-100">Digital Health Index</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreBadgeBg(health.overall_score)}`}>
                {health.security_status}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Evaluates multidimensional digital posture: protected memories, organized archives, safe inbox cleanup, and active threat mitigation.
            </p>
          </div>
        </div>

        {/* Right: Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center">
            <Shield className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-lg font-bold font-cyber text-slate-100">{health.protected_count}</span>
            <span className="text-[11px] text-slate-400">Shielded</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center">
            <FolderCheck className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-lg font-bold font-cyber text-slate-100">{health.organised_count}</span>
            <span className="text-[11px] text-slate-400">Organised</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center">
            <Trash2 className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-lg font-bold font-cyber text-slate-100">{health.cleanup_count}</span>
            <span className="text-[11px] text-slate-400">Cleaned</span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
            health.unresolved_threats_count > 0 
              ? 'bg-rose-950/40 border-rose-500/50 animate-pulse' 
              : 'bg-slate-900/60 border-slate-800/80'
          }`}>
            <ShieldAlert className={`w-5 h-5 mb-1 ${health.unresolved_threats_count > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
            <span className={`text-lg font-bold font-cyber ${health.unresolved_threats_count > 0 ? 'text-rose-300' : 'text-slate-100'}`}>
              {health.unresolved_threats_count}
            </span>
            <span className="text-[11px] text-slate-400">Active Threats</span>
          </div>
        </div>
      </div>

      {/* Critical Threat Alert Banner (remains prominent even if score is high!) */}
      {health.unresolved_threats_count > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Security Alert:</strong> You have {health.unresolved_threats_count} uninvestigated suspicious/phishing item(s). Open <strong>Scam Detective</strong> to investigate clues.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
