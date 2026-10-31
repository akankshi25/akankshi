import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import { Award, Sparkles, CheckCircle2, Lock, RefreshCw, Star, Trophy, Shield } from 'lucide-react';

const LEVEL_TIERS = [
  { level: 1, title: 'Beginner Explorer', minXp: 0, maxXp: 100, icon: '🌱' },
  { level: 2, title: 'Digital Adventurer', minXp: 100, maxXp: 250, icon: '⚔️' },
  { level: 3, title: 'Realm Protector', minXp: 250, maxXp: 500, icon: '🛡️' },
  { level: 4, title: 'Master Organiser', minXp: 500, maxXp: 900, icon: '🗝️' },
  { level: 5, title: 'Questify Guardian', minXp: 900, maxXp: 1500, icon: '👑' },
  { level: 6, title: 'Digital Legend', minXp: 1500, maxXp: 999999, icon: '⭐' },
];

export default function RewardsPage() {
  const { playClick } = useSound();
  const { showToast } = useGame();

  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      const data = await api.getRewards();
      setRewards(data);
    } catch (err) {
      showToast(err.message || "Failed to load rewards.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  if (loading || !rewards) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm font-cyber text-slate-400">Loading Rewards Vault...</span>
      </div>
    );
  }

  const unlockedCodes = new Set(rewards.achievements.map(a => a.code));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              REWARDS & RANK ADVANCEMENT
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Verified XP is recorded in our idempotent tamper-evident reward ledger. Complete missions and maintain health score milestones to advance through tiers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-right shrink-0">
          <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">Current Score</div>
          <div className="text-2xl font-black font-cyber text-slate-100">{rewards.xp} XP</div>
          <div className="text-[11px] text-slate-400">Level {rewards.level}: {rewards.level_title}</div>
        </div>
      </div>

      {/* Level Progression Roadmap */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Guardian Level Roadmap</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVEL_TIERS.map(tier => {
            const isCurrent = rewards.level === tier.level;
            const isUnlocked = rewards.xp >= tier.minXp;

            return (
              <div
                key={tier.level}
                className={`glass-panel rounded-2xl p-5 border relative ${
                  isCurrent 
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/60' 
                    : isUnlocked 
                    ? 'border-emerald-500/40 bg-emerald-950/20' 
                    : 'border-slate-800 bg-slate-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{tier.icon}</span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                    isCurrent 
                      ? 'border-cyan-400 bg-cyan-950 text-cyan-300' 
                      : isUnlocked 
                      ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300' 
                      : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}>
                    {isCurrent ? 'Current Rank' : isUnlocked ? 'Achieved' : 'Locked'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100">
                  Level {tier.level}: {tier.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {tier.minXp} - {tier.maxXp < 999999 ? `${tier.maxXp} XP` : '∞'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Badges of Honor ({rewards.achievements.length} Unlocked)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { code: 'OCEAN_SAVER', title: 'Ocean Saver', desc: 'Defeated your first clutter monster shark and moved digital junk to Central Trash.', icon: '🌊' },
            { code: 'TREASURE_HUNTER', title: 'Treasure Hunter', desc: 'Successfully classified and placed important documents into Kingdom Chests.', icon: '🗝️' },
            { code: 'GUARDIAN_OF_MEMORIES', title: 'Guardian of Memories', desc: 'Shielded high-value family and academic files with Guardian wards.', icon: '🛡️' },
            { code: 'SCAM_INVESTIGATOR', title: 'Scam Investigator', desc: 'Inspected phishing evidence and rendered an astute detective verdict.', icon: '🔍' },
            { code: 'INBOX_MASTER', title: 'Inbox Master', desc: 'Achieved a clean, organized inbox with zero unresolved urgent threats.', icon: '👑' },
            { code: 'DIGITAL_SAFETY_CHAMPION', title: 'Digital Safety Champion', desc: 'Maintained an exemplary Digital Health Score above 85 points.', icon: '⭐' }
          ].map(ach => {
            const isUnlocked = unlockedCodes.has(ach.code);

            return (
              <div
                key={ach.code}
                className={`glass-panel rounded-2xl p-5 border flex items-start gap-4 ${
                  isUnlocked 
                    ? 'border-amber-500/50 bg-amber-950/20' 
                    : 'border-slate-800 bg-slate-900/30 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                  isUnlocked ? 'border-amber-500/40 bg-slate-900' : 'border-slate-800 bg-slate-950'
                }`}>
                  {ach.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100">{ach.title}</h4>
                    {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
