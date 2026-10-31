import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import { api } from '../services/api';
import DigitalHealthScore from '../components/DigitalHealthScore';
import { 
  Waves, Crown, Shield, Search, ArrowRight, Play, 
  Sparkles, CheckCircle2, Clock, AlertTriangle, RefreshCw, 
  Mail, HardDrive, MessageSquare, ChevronRight
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { setActiveSource, launchGameWithSelectedItems, showToast } = useGame();
  const { playClick, playScan } = useSound();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingSource, setAnalyzingSource] = useState(null);

  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      showToast(err.message || "Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStartAnalysis = async (source) => {
    setAnalyzingSource(source);
    playScan();
    setActiveSource(source);

    try {
      const res = await api.startAnalysis(source);
      showToast(`AI Analysis complete for ${source.toUpperCase()}! ${res.analyzed_count} items classified.`, 'success');
      onNavigate('analysis');
    } catch (err) {
      showToast(err.message || "Analysis failed.", "error");
    } finally {
      setAnalyzingSource(null);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-cyber text-slate-400">Loading Questify Citadel...</span>
      </div>
    );
  }

  const { health, connections, game_progress, active_missions, pending_approvals_count, recent_activity } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Personal Profile & Level Progress */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[2px] shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
              {dashboardData.user.avatar || '🧙‍♂️'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-cyber text-slate-100">
                {dashboardData.user.full_name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 font-bold">
                Level {dashboardData.user.level}
              </span>
            </div>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              Rank: {dashboardData.user.level_title}
            </p>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="w-full md:w-72 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">XP Progress</span>
            <span className="font-mono text-cyan-300 font-bold">{dashboardData.user.xp} XP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(10, (dashboardData.user.xp % 250) / 2.5))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Current Tier</span>
            <span>Next Rank: Master</span>
          </div>
        </div>
      </div>

      {/* 2. Digital Health Score Component */}
      <DigitalHealthScore health={health} />

      {/* 3. Quick AI Analysis Launcher (Gmail, Drive, Messages) */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Launch Source Analysis</span>
            </h2>
            <p className="text-xs text-slate-400">
              Run the 2-layer AI classification engine on your digital inboxes and storage assets.
            </p>
          </div>
          <button
            onClick={() => onNavigate('sources')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <span>Manage Connections</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gmail Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">Gmail</div>
                  <div className="text-[11px] text-emerald-400 font-medium">Demo Ready // OAuth Active</div>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Analyses newsletters, academic schedules, personal photos, and suspicious banking alerts.
            </p>
            <button
              onClick={() => handleStartAnalysis('gmail')}
              disabled={analyzingSource === 'gmail'}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-md shadow-cyan-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{analyzingSource === 'gmail' ? 'Classifying...' : 'Analyse Gmail'}</span>
            </button>
          </div>

          {/* Google Drive Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">Google Drive</div>
                  <div className="text-xs text-emerald-400 font-medium">Demo Ready // OAuth Active</div>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Scans academic lecture notes, family videos, resumes, spreadsheets, and temporary caches.
            </p>
            <button
              onClick={() => handleStartAnalysis('drive')}
              disabled={analyzingSource === 'drive'}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{analyzingSource === 'drive' ? 'Classifying...' : 'Analyse Google Drive'}</span>
            </button>
          </div>

          {/* Messages & SMS Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/50 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">Messages & SMS</div>
                  <div className="text-xs text-cyan-400 font-medium">Banking Sandbox Ready</div>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Evaluates banking OTPs, unknown payer UPI credits, salary receipts, and phishing threats.
            </p>
            <button
              onClick={() => handleStartAnalysis('messages')}
              disabled={analyzingSource === 'messages'}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{analyzingSource === 'messages' ? 'Classifying...' : 'Analyse Messages'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Four Connected Game Worlds */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          <span>Interactive Game Worlds</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ocean Explorer */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-cyan-900/50 bg-gradient-to-b from-cyan-950/40 to-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🦈</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  Cleanup World
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-cyan-300 mb-1">Ocean Explorer</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                Battle monster sharks to safely move clutter and expired promotional emails to Central Trash.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Purged: <strong className="text-cyan-300">{game_progress.ocean_explorer.completed_actions}</strong></span>
              <button 
                onClick={() => {
                  setActiveSource('gmail');
                  onNavigate('analysis');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <span>Select & Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lost Kingdom */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-amber-900/50 bg-gradient-to-b from-amber-950/40 to-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🗝️</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                  Organisation
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-amber-300 mb-1">Lost Kingdom</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                Sort unorganized academic notes, financial statements, and resumes into ancient Stronghold Chests.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Sorted: <strong className="text-amber-300">{game_progress.lost_kingdom.completed_actions}</strong></span>
              <button 
                onClick={() => {
                  setActiveSource('drive');
                  onNavigate('analysis');
                }}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <span>Select & Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guardian Realm */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-indigo-900/50 bg-gradient-to-b from-indigo-950/40 to-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🛡️</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
                  Protection
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-indigo-300 mb-1">Guardian Realm</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                Cast Aegis guardian shields over irreplaceable personal memories and critical credentials.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Shielded: <strong className="text-indigo-300">{game_progress.guardian_realm.completed_actions}</strong></span>
              <button 
                onClick={() => {
                  setActiveSource('drive');
                  onNavigate('analysis');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <span>Select & Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scam Detective */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-purple-900/50 bg-gradient-to-b from-purple-950/40 to-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🕵️‍♂️</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                  Investigation
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-purple-300 mb-1">Scam Detective</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                Inspect forensic clues on fake bank emails, malicious attachments, and utility bill scams.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Resolved: <strong className="text-purple-300">{game_progress.scam_detective.completed_actions}</strong></span>
              <button 
                onClick={() => {
                  setActiveSource('messages');
                  onNavigate('analysis');
                }}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
              >
                <span>Select & Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Active Missions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Missions Section */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Current Missions & Quests</span>
            </h2>
            <button
              onClick={() => onNavigate('missions')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View Quest Log
            </button>
          </div>

          <div className="space-y-3">
            {active_missions.slice(0, 3).map(m => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-200 truncate">{m.title}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                      m.status === 'completed' 
                        ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300' 
                        : 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                    }`}>
                      {m.status === 'completed' ? 'Done' : `${m.current_count}/${m.target_count}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{m.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-amber-400">+{m.xp_reward} XP</div>
                  <span className="text-[10px] text-slate-500 uppercase">{m.mission_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Audit */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Verified Activity Audit</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Full History
            </button>
          </div>

          <div className="space-y-2.5">
            {recent_activity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent actions recorded. Analyze a source to get started!
              </div>
            ) : (
              recent_activity.slice(0, 4).map(act => (
                <div key={act.id} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs">
                  <div className="text-slate-300 font-medium line-clamp-1">{act.description}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{act.created_at}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
