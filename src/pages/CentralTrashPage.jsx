import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import Modal from '../components/Modal';
import { 
  Trash2, RotateCcw, AlertTriangle, CheckCircle2, 
  HelpCircle, RefreshCw, Mail, HardDrive, MessageSquare, ShieldAlert
} from 'lucide-react';

export default function CentralTrashPage() {
  const { playClick, playApproval, playWarning } = useSound();
  const { showToast } = useGame();

  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'gmail', 'drive', 'messages'
  const [restoringId, setRestoringId] = useState(null);
  
  // Permanent deletion confirmation modal state
  const [itemToPurge, setItemToPurge] = useState(null);
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);
  const [purging, setPurging] = useState(false);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await api.getCentralTrash(activeTab === 'all' ? null : activeTab);
      setTrashItems(data);
    } catch (err) {
      showToast(err.message || "Failed to load Central Trash.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeTab]);

  const handleRestore = async (item) => {
    setRestoringId(item.item_id);
    playClick();

    try {
      await api.restoreTrashItem(item.item_id);
      playApproval();
      showToast(`Restored '${item.title}' back to ${item.original_location}!`, 'success');
      fetchTrash();
    } catch (err) {
      playWarning();
      showToast(err.message || "Failed to restore item.", "error");
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpenPurgeModal = (item) => {
    playWarning();
    setItemToPurge(item);
    setPurgeConfirmed(false);
  };

  const handleExecutePermanentDelete = async () => {
    if (!itemToPurge || !purgeConfirmed) return;
    setPurging(true);
    playClick();

    try {
      await api.permanentDelete([itemToPurge.item_id], true);
      playApproval();
      showToast(`Permanently deleted '${itemToPurge.title}'.`, 'info');
      setItemToPurge(null);
      fetchTrash();
    } catch (err) {
      playWarning();
      showToast(err.message || "Permanent deletion failed.", "error");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold font-cyber text-slate-100">
              CENTRAL TRASH & RECOVERY VAULT
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Items cleaned through Ocean Explorer or approved for deletion reside here safely. You can restore items to their original source folders, or permanently purge them with separate confirmation.
          </p>
        </div>

        {/* Source Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Trash ({trashItems.length})
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'gmail' ? 'bg-red-950 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'drive' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'messages' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
          </button>
        </div>
      </div>

      {/* Trash Items List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm font-cyber text-slate-400">Loading Central Trash...</span>
        </div>
      ) : trashItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border-slate-800 space-y-3">
          <Trash2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Central Trash is Empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No items currently residing in Central Trash. Items you approve for deletion during Ocean Explorer cleanup missions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trashItems.map(item => (
            <div
              key={item.trash_id}
              className="glass-panel rounded-2xl p-5 border border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.source}
                  </span>
                  <span className="text-xs text-slate-400">
                    Deleted on: {item.deleted_at}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 break-words">{item.title}</h4>
                <div className="text-xs text-slate-400">
                  Original Location: <span className="text-slate-300 font-mono">{item.original_location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleRestore(item)}
                  disabled={restoringId === item.item_id}
                  className="px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{restoringId === item.item_id ? 'Restoring...' : 'Restore'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal(item)}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Separate Warning Modal for Permanent Deletion */}
      {itemToPurge && (
        <Modal
          isOpen={true}
          onClose={() => setItemToPurge(null)}
          title={
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Confirm Permanent Deletion</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/60 space-y-2">
              <div className="text-xs font-bold text-rose-200">
                CAUTION: THIS ACTION CANNOT BE UNDONE!
              </div>
              <p className="text-xs text-rose-300 leading-relaxed">
                You are about to permanently purge the following digital item. Once purged, recovery will no longer be possible through Central Trash or source recovery.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-100">{itemToPurge.title}</div>
              <div className="text-slate-400">Source: <span className="font-mono text-cyan-300">{itemToPurge.source.toUpperCase()}</span></div>
              <div className="text-slate-400">Original Path: <span className="font-mono">{itemToPurge.original_location}</span></div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={purgeConfirmed}
                onChange={(e) => setPurgeConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-xs text-slate-200 font-medium leading-relaxed">
                I understand that permanent deletion is irreversible, and I explicitly approve purging this item.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToPurge(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePermanentDelete}
                disabled={!purgeConfirmed || purging}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  purgeConfirmed 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{purging ? 'Purging from Server...' : 'Confirm Permanent Deletion'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
