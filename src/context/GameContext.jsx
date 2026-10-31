import React, { createContext, useContext, useState } from 'react';
import confetti from 'canvas-confetti';
import { useSound } from './SoundContext';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { playLevelUp, playApproval } = useSound();
  const { updateLocalXP } = useAuth();

  const [activeSource, setActiveSource] = useState('gmail');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedItemsForGame, setSelectedItemsForGame] = useState([]);
  const [activeGameWorld, setActiveGameWorld] = useState(null); // 'ocean_explorer', 'lost_kingdom', 'guardian_realm', 'scam_detective'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const triggerLevelUpCelebration = (newLevel, newTitle) => {
    playLevelUp();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#f59e0b', '#6366f1', '#a855f7', '#10b981']
    });
    showToast(`🎉 LEVEL UP! You reached Level ${newLevel}: ${newTitle}!`, 'success');
  };

  const handleActionCompleted = (batchResult) => {
    playApproval();
    if (batchResult.xp_awarded > 0) {
      showToast(`✨ Verified! +${batchResult.xp_awarded} XP earned!`, 'success');
    }
    if (batchResult.level_up) {
      triggerLevelUpCelebration(batchResult.new_level, batchResult.new_level_title);
    }
    if (batchResult.new_level) {
      updateLocalXP(null, batchResult.new_level, batchResult.new_level_title);
    }
  };

  const launchGameWithSelectedItems = (gameWorld, items) => {
    if (!items || items.length === 0) {
      showToast("Please select at least one item first.", "warning");
      return;
    }
    setSelectedItemsForGame(items);
    setActiveGameWorld(gameWorld);
  };

  const exitGameWorld = () => {
    setActiveGameWorld(null);
    setSelectedItemsForGame([]);
  };

  return (
    <GameContext.Provider value={{
      activeSource,
      setActiveSource,
      analysisResults,
      setAnalysisResults,
      selectedItemsForGame,
      setSelectedItemsForGame,
      activeGameWorld,
      setActiveGameWorld,
      launchGameWithSelectedItems,
      exitGameWorld,
      toastMessage,
      showToast,
      handleActionCompleted,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
