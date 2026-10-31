import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import Modal from '../components/Modal';
import { 
  Sparkles, Gamepad2, Shield, Waves, Crown, 
  Search, ArrowRight, CheckCircle2, Lock, Mail, User,
  Eye, EyeOff, AlertCircle, ChevronRight, RefreshCw, KeyRound, Check
} from 'lucide-react';

export default function WelcomePage({ onEnterApp }) {
  const { login, register, loginDemo } = useAuth();
  const { playClick, playApproval, playWarning } = useSound();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      playWarning();
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    if (password.length < 6) {
      playWarning();
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    playClick();

    try {
      if (isRegister) {
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
      playApproval();
      if (onEnterApp) onEnterApp();
    } catch (err) {
      playWarning();
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLoading(true);
    playClick();
    try {
      await loginDemo();
      playApproval();
      if (onEnterApp) onEnterApp();
    } catch (err) {
      playWarning();
      setError('Failed to launch demo mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    playClick();
    setForgotSent(true);
    playApproval();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-2xl font-cyber tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              QUESTIFY AI
            </span>
            <div className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block">
              Gamified Digital Organization & Security Platform
            </div>
          </div>
        </div>

        <button
          onClick={handleDemoMode}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
        >
          <Gamepad2 className="w-4 h-4 text-cyan-400" />
          <span>Launch Demo Mode</span>
        </button>
      </header>

      {/* Main Hero & Authentication Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center flex-1 w-full">
        {/* Left Column: Product Hero Pitch */}
        <div className="lg:col-span-7 space-y-7">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 text-xs sm:text-sm font-medium shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI-Driven Cleanup • Threat Awareness • Immersive Gaming</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-cyber tracking-tight leading-[1.12] text-slate-100">
            Clean Your Digital World. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Complete Quests. Earn Rewards.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
            Questify AI transforms mundane digital clutter management across Gmail, Google Drive, and SMS into four connected, interactive gaming worlds powered by a dual-layer AI security engine.
          </p>

          {/* Four Game Worlds Mini Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 max-w-xl">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-500/40 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🦈
              </div>
              <div>
                <div className="text-sm font-bold text-cyan-300">Ocean Explorer</div>
                <div className="text-xs text-slate-400 mt-0.5">Digital cleanup & trash recycling</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-900/50 hover:border-amber-500/40 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🗝️
              </div>
              <div>
                <div className="text-sm font-bold text-amber-300">Lost Kingdom</div>
                <div className="text-xs text-slate-400 mt-0.5">Archive & treasure chest sorting</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-indigo-900/50 hover:border-indigo-500/40 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🛡️
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-300">Guardian Realm</div>
                <div className="text-xs text-slate-400 mt-0.5">Protect vital digital assets</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-purple-900/50 hover:border-purple-500/40 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🕵️‍♂️
              </div>
              <div>
                <div className="text-sm font-bold text-purple-300">Scam Detective</div>
                <div className="text-xs text-slate-400 mt-0.5">Phishing & threat investigations</div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Google OAuth 2.0
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Secure Salted Hashes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Two-Layer AI Verification
            </span>
          </div>
        </div>

        {/* Right Column: Standardized & Polished Authentication Card */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-panel rounded-3xl p-7 sm:p-8 border border-slate-800/90 shadow-2xl relative backdrop-blur-xl">
            {/* Modern Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-1 mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsRegister(false);
                  setError('');
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  !isRegister 
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsRegister(true);
                  setError('');
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isRegister 
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Create Account</span>
              </button>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isRegister 
                  ? 'Join Questify to start organizing clutter and leveling up.' 
                  : 'Enter your credentials to access your digital command center.'}
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setForgotSent(false);
                        setShowForgotModal(true);
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-cyan-900/30 hover:shadow-cyan-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Questify Account' : 'Sign In to Questify'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Clean Section Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold text-slate-400 bg-slate-900/90 px-3 w-fit mx-auto rounded-full border border-slate-800">
                or explore without credentials
              </div>
            </div>

            {/* High-Visibility Preloaded Demo Mode Card */}
            <button
              type="button"
              onClick={handleDemoMode}
              disabled={loading}
              className="w-full p-4 rounded-2xl border border-cyan-500/30 bg-slate-900/70 hover:bg-slate-800/80 hover:border-cyan-400/60 transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:text-cyan-300 transition-all shadow-inner">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition flex items-center gap-2">
                    <span>Try Preloaded Demo Mode</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold uppercase tracking-wider">
                      Instant
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Explore all 4 game worlds & sample data with 1 click
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Account Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter the email address registered with your Questify AI account to receive a secure recovery code.
          </p>

          {forgotSent ? (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4" />
                <span>Password Reset Email Dispatched!</span>
              </div>
              <p className="text-xs text-emerald-400">
                If an account exists for <span className="font-semibold text-emerald-200">{forgotEmail || email || 'your email'}</span>, reset instructions have been sent. You may also use the <strong>Preloaded Demo Mode</strong> anytime!
              </p>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="mt-3 w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={forgotEmail || email}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-semibold transition shadow-md"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Standardized Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 max-w-7xl mx-auto w-full px-6 sm:px-8 py-5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 Questify AI. Privacy & Security Verified.</span>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Google OAuth 2.0</span>
          <span>•</span>
          <span>Dual-Layer Classification</span>
          <span>•</span>
          <span>Central Trash Vault</span>
        </div>
      </footer>
    </div>
  );
}