import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { GameProvider, useGame } from './context/GameContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

// Pages
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import ConnectSourcesPage from './pages/ConnectSourcesPage';
import AnalysisResultsPage from './pages/AnalysisResultsPage';
import FinancialShieldPage from './pages/FinancialShieldPage';
import CentralTrashPage from './pages/CentralTrashPage';
import MissionsPage from './pages/MissionsPage';
import RewardsPage from './pages/RewardsPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import SettingsPage from './pages/SettingsPage';

// Games
import OceanWorld from './games/OceanExplorer/OceanWorld';
import KingdomWorld from './games/LostKingdom/KingdomWorld';
import GuardianWorld from './games/GuardianRealm/GuardianWorld';
import DetectiveWorld from './games/ScamDetective/DetectiveWorld';

function MainAppShell() {
  const { isAuthenticated, loading } = useAuth();
  const { activeGameWorld, toastMessage } = useGame();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-100">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-cyber text-cyan-400">Loading Questify AI...</span>
      </div>
    );
  }

  // If not logged in, show Welcome & Login screen
  if (!isAuthenticated) {
    return <WelcomePage onEnterApp={() => setActivePage('dashboard')} />;
  }

  // If an active game world is launched with selected items, render full-screen interactive game!
  if (activeGameWorld === 'ocean_explorer') {
    return <OceanWorld />;
  }
  if (activeGameWorld === 'lost_kingdom') {
    return <KingdomWorld />;
  }
  if (activeGameWorld === 'guardian_realm') {
    return <GuardianWorld />;
  }
  if (activeGameWorld === 'scam_detective') {
    return <DetectiveWorld />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 pb-16">
        {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
        {activePage === 'sources' && <ConnectSourcesPage onNavigate={setActivePage} />}
        {activePage === 'analysis' && <AnalysisResultsPage onNavigate={setActivePage} />}
        {activePage === 'missions' && <MissionsPage onNavigate={setActivePage} />}
        {activePage === 'financial_shield' && <FinancialShieldPage />}
        {activePage === 'central_trash' && <CentralTrashPage />}
        {activePage === 'rewards' && <RewardsPage />}
        {activePage === 'history' && <ActivityHistoryPage />}
        {activePage === 'settings' && <SettingsPage onNavigate={setActivePage} />}
      </main>

      <Toast toast={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <GameProvider>
          <MainAppShell />
        </GameProvider>
      </SoundProvider>
    </AuthProvider>
  );
}
