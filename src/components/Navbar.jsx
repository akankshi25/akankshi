import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { 
  Gamepad2, Shield, Trash2, Award, Clock, Settings, 
  Volume2, VolumeX, LogOut, Sparkles, Database, FileText, ChevronRight
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { soundEnabled, toggleSound, playClick } = useSound();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gamepad2 },
    { id: 'sources', label: 'Connect Sources', icon: Database },
    { id: 'missions', label: 'My Missions', icon: Shield },
    { id: 'financial_shield', label: 'Financial Shield', icon: Shield },
    { id: 'central_trash', label: 'Central Trash', icon: Trash2 },
    { id: 'rewards', label: 'Rewards & Levels', icon: Award },
    { id: 'history', label: 'Activity Audit', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div 
            onClick={() => {
              playClick();
              setActivePage('dashboard');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider font-cyber bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  QUESTIFY AI
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
                Clean Your Digital World. Complete Quests.
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playClick();
                    setActivePage(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                toggleSound();
              }}
              title={soundEnabled ? 'Mute Game SFX' : 'Enable Game SFX'}
              className={`p-2 rounded-xl border transition ${
                soundEnabled 
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/40' 
                  : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* User Level & XP Pill */}
            {isAuthenticated && user && (
              <div 
                onClick={() => {
                  playClick();
                  setActivePage('rewards');
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-sm shadow">
                  {user.avatar || '🧙‍♂️'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                    <span>Lvl {user.level}</span>
                    <span className="text-[10px] text-amber-400 font-normal truncate max-w-[100px]">
                      {user.level_title}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono font-semibold">
                    {user.xp} XP
                  </div>
                </div>
              </div>
            )}

            {/* Logout or Welcome */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  playClick();
                  logout();
                  setActivePage('welcome');
                }}
                title="Sign Out"
                className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Subnavigation Row */}
      <div className="xl:hidden border-t border-slate-800/80 bg-slate-950/90 overflow-x-auto py-2 px-4 flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playClick();
                setActivePage(item.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
