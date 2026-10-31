import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import { Shield, Sparkles, CheckCircle2, RefreshCw, Award, ArrowRight } from 'lucide-react';

export default function MissionsPage({ onNavigate }) {
  const { playClick } = useSound();
  const { showToast, setActiveSource } = useGame();

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    try {
      const data = await api.getMissions();
      setMissions(data);
    } catch (err) {
      showToast(err.message || "Failed to load missions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const getGameBadge = (game) => {
    switch (game) {
      case 'ocean_explorer':
        return { label: 'Ocean Explorer', color: 'border-cyan-500/40 bg-cyan-950 text-cyan-300' };
      case 'lost_kingdom':
        return { label: 'Lost Kingdom', color: 'border-amber-500/40 bg-amber-950 text-amber-300' };
      case 'guardian_realm':
        return { label: 'Guardian Realm', color: 'border-indigo-500/40 bg-indigo-950 text-indigo-300' };
      case 'scam_detective':
        return { label: 'Scam Detective', color: 'border-purple-500/40 bg-purple-950 text-purple-300' };
      default:
        return { label: 'General Quest', color: 'border-slate-700 bg-slate-900 text-slate-300' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              MISSION CONTROL & REWARD LOG
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Complete daily and weekly quests across the four interactive game worlds to earn verified XP rewards and level up your Digital Guardian rank.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-cyber text-slate-400">Loading active quests...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map(m => {
            const badge = getGameBadge(m.game);
            const isDone = m.status === 'completed';

            return (
              <div
                key={m.id}
                className={`glass-panel rounded-2xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                  isDone 
                    ? 'border-emerald-500/40 bg-emerald-950/20' 
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                      {m.mission_type}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <span>{m.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Progress:</span>
                    <span className={`text-xs font-mono font-bold ${isDone ? 'text-emerald-400' : 'text-cyan-300'}`}>
                      {m.current_count} / {m.target_count}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      +{m.xp_reward} XP
                    </span>
                    {!isDone && (
                      <button
                        onClick={() => {
                          playClick();
                          setActiveSource(m.game === 'ocean_explorer' ? 'gmail' : m.game === 'lost_kingdom' ? 'drive' : 'messages');
                          onNavigate('analysis');
                        }}
                        className="px-3 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <span>Quest</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
