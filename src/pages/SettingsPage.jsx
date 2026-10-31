import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { 
  Settings, User, Shield, Volume2, VolumeX, Trash2, 
  RefreshCw, LogOut, AlertTriangle, CheckCircle2, Lock
} from 'lucide-react';

export default function SettingsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const { soundEnabled, toggleSound, playClick, playWarning, playApproval } = useSound();
  const { showToast } = useGame();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetDemoData = async () => {
    setResetting(true);
    playClick();

    try {
      await api.resetDemoData();
      playApproval();
      showToast("Demo environment reset to fresh initial state.", "success");
      setConfirmResetOpen(false);
      onNavigate('dashboard');
    } catch (err) {
      playWarning();
      showToast(err.message || "Reset failed.", "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              SETTINGS & USER PREFERENCES
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Manage your account security, AI preferences, data retention settings, and audio effects.
          </p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>User Profile Identity</span>
        </h2>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
            {user?.avatar || '🧙‍♂️'}
          </div>
          <div className="space-y-0.5">
            <div className="text-base font-bold text-slate-100">{user?.full_name}</div>
            <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
            <div className="text-xs text-amber-400 font-semibold">
              Level {user?.level}: {user?.level_title} ({user?.xp} XP)
            </div>
          </div>
        </div>
      </div>

      {/* Preferences & Sound */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span>Experience & Sound Effects</span>
        </h2>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div>
            <div className="text-sm font-bold text-slate-200">Interactive Game Audio (SFX)</div>
            <div className="text-xs text-slate-400">Web Audio API synthesized game chimes, scanner sweeps, and approval fanfare.</div>
          </div>
          <button
            onClick={() => {
              toggleSound();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              soundEnabled 
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Privacy, Retention & Danger Zone */}
      <div className="glass-panel rounded-3xl p-6 border border-rose-950/60 bg-rose-950/10 space-y-4">
        <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Privacy & Data Management</span>
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Questify AI adheres to strict data minimization principles. We do not store Google account passwords, and items moved to Central Trash can be purged or restored anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-bold transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Data to Initial State</span>
          </button>

          <button
            onClick={() => {
              playClick();
              logout();
              onNavigate('welcome');
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Questify</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmResetOpen && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmResetOpen(false)}
          title={
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Demo Environment Reset</span>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset all your demo classifications, clear your Central Trash, reset your XP back to 0, and reload the initial demo email, drive, and banking messages.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={resetting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{resetting ? 'Resetting...' : 'Confirm Reset'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
