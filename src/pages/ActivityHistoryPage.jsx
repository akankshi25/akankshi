import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import { Clock, Search, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ActivityHistoryPage() {
  const { playClick } = useSound();
  const { showToast } = useGame();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getActivityHistory(eventFilter || null, searchTerm || null);
      setHistory(data);
    } catch (err) {
      showToast(err.message || "Failed to load activity history.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [eventFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              ACTIVITY HISTORY & VERIFICATION AUDIT
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Immutable log of all user approvals, AI classification decisions, backend verification checks, Central Trash recovery events, and XP awards.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit events..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </span>
        {[
          { id: '', label: 'All Events' },
          { id: 'XP_EARNED', label: 'XP Rewards' },
          { id: 'ACTION_MOVE_TO_TRASH', label: 'Trash Purges' },
          { id: 'ACTION_ORGANISE_CHEST', label: 'Organisations' },
          { id: 'ACTION_PROTECT_ITEM', label: 'Protections' },
          { id: 'ITEM_RESTORED', label: 'Restorations' },
          { id: 'USER_CORRECTION', label: 'AI Corrections' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              playClick();
              setEventFilter(tab.id);
            }}
            className={`px-3 py-1 rounded-full border transition whitespace-nowrap text-[11px] font-semibold ${
              eventFilter === tab.id 
                ? 'bg-purple-950 border-purple-400 text-purple-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Log Timeline */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-cyber text-slate-400">Loading audit ledger...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border-slate-800 space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No events found</h3>
          <p className="text-xs text-slate-400">Perform actions in any game world to see audit entries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="glass-panel rounded-2xl p-4 border border-slate-800/80 bg-slate-900/40 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {item.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {item.created_at}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200">{item.description}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
