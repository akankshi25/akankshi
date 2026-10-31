import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../context/SoundContext';
import { useGame } from '../context/GameContext';
import { 
  Database, Mail, HardDrive, MessageSquare, CheckCircle2, 
  AlertCircle, Smartphone, UploadCloud, RefreshCw, Unplug, Sparkles
} from 'lucide-react';

export default function ConnectSourcesPage() {
  const { playClick, playApproval } = useSound();
  const { showToast } = useGame();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingSource, setConnectingSource] = useState(null);

  const fetchConnections = async () => {
    try {
      const data = await api.getConnections();
      setConnections(data);
    } catch (err) {
      showToast(err.message || "Failed to load connections.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnect = async (source, isDemo = true) => {
    setConnectingSource(source);
    playClick();

    try {
      await api.connectSource(source, isDemo);
      playApproval();
      showToast(`Connected ${source.toUpperCase()} successfully (${isDemo ? 'Demo Mode' : 'OAuth'})!`, 'success');
      fetchConnections();
    } catch (err) {
      showToast(err.message || "Connection failed.", "error");
    } finally {
      setConnectingSource(null);
    }
  };

  const handleDisconnect = async (source) => {
    playClick();
    try {
      await api.disconnectSource(source);
      showToast(`Disconnected ${source.toUpperCase()}.`, 'info');
      fetchConnections();
    } catch (err) {
      showToast(err.message || "Disconnection failed.", "error");
    }
  };

  const getConnection = (source) => {
    return connections.find(c => c.source === source) || { status: 'not_connected' };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-semibold">
          <Database className="w-4 h-4" />
          <span>OAuth 2.0 & Digital Integration Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-cyber tracking-tight text-slate-100">
          CONNECT YOUR DIGITAL WORLD
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Connect your accounts securely via Google OAuth 2.0 or test with full preloaded demo datasets across Gmail, Google Drive, and Messages.
        </p>
      </div>

      {/* 3 Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Gmail */}
        {(() => {
          const conn = getConnection('gmail');
          const isConnected = conn.status === 'connected';

          return (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                    isConnected 
                      ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300' 
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100">Gmail Integration</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    Enables reading headers, snippets, and attachments metadata. Supports applying labels, archiving, and moving clutter to Gmail Trash.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Permitted Scopes:</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>gmail.readonly & gmail.modify (minimum scopes)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero password storage guarantee</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect('gmail')}
                    className="w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unplug className="w-4 h-4" />
                    <span>Disconnect Gmail</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleConnect('gmail', true)}
                      disabled={connectingSource === 'gmail'}
                      className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-md shadow-cyan-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{connectingSource === 'gmail' ? 'Connecting...' : 'Connect Demo Data'}</span>
                    </button>
                    <button
                      onClick={() => handleConnect('gmail', false)}
                      className="w-full py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      Connect with Google OAuth 2.0
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Card 2: Google Drive */}
        {(() => {
          const conn = getConnection('drive');
          const isConnected = conn.status === 'connected';

          return (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                    isConnected 
                      ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300' 
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100">Google Drive</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    Retrieves file metadata, sizes, and MIME types. Organizes academic and career assets into approved folders, or moves duplicate files to Drive Trash.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Permitted Scopes:</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>drive.metadata.readonly & drive.file</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Explicit user action approval for folder moves</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect('drive')}
                    className="w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unplug className="w-4 h-4" />
                    <span>Disconnect Drive</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleConnect('drive', true)}
                      disabled={connectingSource === 'drive'}
                      className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{connectingSource === 'drive' ? 'Connecting...' : 'Connect Demo Data'}</span>
                    </button>
                    <button
                      onClick={() => handleConnect('drive', false)}
                      className="w-full py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      Connect with Google OAuth 2.0
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Card 3: Messages & SMS */}
        {(() => {
          const conn = getConnection('messages');
          const isConnected = conn.status === 'connected';

          return (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                    isConnected 
                      ? 'border-emerald-500/40 bg-emerald-950 text-emerald-300' 
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}>
                    {isConnected ? 'Sandbox Active' : 'Not Connected'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100">Messages & SMS</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    Dedicated interface for analyzing banking alerts, OTPs, and payment requests. Web apps cannot directly read Android SMS without companion software.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>Android Architecture Notice:</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Full phone SMS access requires our native companion service with Google Play policy compliance.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect('messages')}
                    className="w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unplug className="w-4 h-4" />
                    <span>Reset Sandbox</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleConnect('messages', true)}
                      disabled={connectingSource === 'messages'}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{connectingSource === 'messages' ? 'Connecting...' : 'Load Banking Demo SMS'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
