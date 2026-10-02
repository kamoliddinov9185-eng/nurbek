import React, { useEffect, useRef, useState } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { ModeSelectModal } from './components/ModeSelectModal';
import { GarageModal } from './components/GarageModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PauseModal } from './components/PauseModal';
import { ResultsModal } from './components/ResultsModal';
import { GameHUD } from './components/GameHUD';
import { GameEngine, GameTelemetry } from './game/GameEngine';
import { GameMode, PlayerProfile, GameSettings } from './types/game';
import { loadProfile, saveProfile, loadSettings, saveSettings } from './utils/storage';
import { soundEngine } from './audio/SoundSystem';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [currentMode, setCurrentMode] = useState<GameMode>('FREE_DRIVE');

  // Profile & Settings
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPause, setShowPause] = useState(false);

  // Live Game References
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    rpm: 0.15,
    gear: 1,
    nitro: 100,
    driftScore: 0,
    driftMultiplier: 1,
    isDrifting: false,
    racePosition: 1,
    currentLap: 1,
    totalLaps: 2,
    raceTime: 0,
    countdown: 3,
    timeTrialRemaining: 40,
    trafficScore: 0,
    nearMissCount: 0,
    lastNearMissNotice: null,
    modeFinished: false,
    finishResults: null,
  });

  // Save profile and settings
  const handleUpdateProfile = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    if (engineRef.current) {
      engineRef.current.setWeatherAndTime(newSettings.weather, newSettings.timeOfDay);
      engineRef.current.setGraphicsQuality(newSettings.quality);
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Start driving in a selected mode
  const startGame = (mode: GameMode) => {
    setCurrentMode(mode);
    setShowModeSelect(false);
    setShowGarage(false);
    setGameState('PLAYING');
  };

  // Mount/Unmount GameEngine when entering/leaving PLAYING state
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!gameContainerRef.current) return;

    const engine = new GameEngine(
      gameContainerRef.current,
      profile,
      settings,
      currentMode,
      minimapCanvasRef.current,
      (t) => setTelemetry(t),
      (p) => handleUpdateProfile(p)
    );
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [gameState, currentMode]);

  // Pause hotkey (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && gameState === 'PLAYING') {
        if (!telemetry.modeFinished) {
          setShowPause((prev) => {
            const next = !prev;
            if (engineRef.current) {
              engineRef.current.setPaused(next);
            }
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, telemetry.modeFinished]);

  // Pause Menu Actions
  const handleResume = () => {
    setShowPause(false);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
    }
  };

  const handleRestart = () => {
    setShowPause(false);
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    // Force re-instantiation
    setTimeout(() => {
      if (gameContainerRef.current) {
        const engine = new GameEngine(
          gameContainerRef.current,
          profile,
          settings,
          currentMode,
          minimapCanvasRef.current,
          (t) => setTelemetry(t),
          (p) => handleUpdateProfile(p)
        );
        engineRef.current = engine;
      }
    }, 50);
  };

  const handleExitToMenu = () => {
    setShowPause(false);
    setGameState('MENU');
  };

  const handleOpenGarageFromGame = () => {
    setShowPause(false);
    setGameState('MENU');
    setShowGarage(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* Initial Loading Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      {/* 3D Game Canvas Container (Active when PLAYING) */}
      <div
        ref={gameContainerRef}
        className={`absolute inset-0 w-full h-full z-0 ${gameState === 'PLAYING' ? 'block' : 'hidden'}`}
      />

      {/* Main Menu (Active when MENU) */}
      {gameState === 'MENU' && (
        <MainMenu
          profile={profile}
          settings={settings}
          onPlay={() => setShowModeSelect(true)}
          onGarage={() => setShowGarage(true)}
          onSettings={() => setShowSettings(true)}
          onHowToPlay={() => setShowHowToPlay(true)}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      )}

      {/* In-Game Heads-Up Display (Active when PLAYING) */}
      {gameState === 'PLAYING' && (
        <GameHUD
          telemetry={telemetry}
          mode={currentMode}
          onPause={() => {
            setShowPause(true);
            if (engineRef.current) engineRef.current.setPaused(true);
          }}
          onCycleCamera={() => {
            if (engineRef.current) engineRef.current.cycleCamera();
          }}
          engineRef={engineRef}
          minimapCanvasRef={minimapCanvasRef}
        />
      )}

      {/* Game Mode Selection Modal */}
      {showModeSelect && (
        <ModeSelectModal
          onSelectMode={(mode) => startGame(mode)}
          onClose={() => setShowModeSelect(false)}
        />
      )}

      {/* Garage Showroom & Customization Modal */}
      {showGarage && (
        <GarageModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowGarage(false)}
          onDriveCar={(carId) => {
            const updated = { ...profile, selectedCarId: carId };
            handleUpdateProfile(updated);
            setShowGarage(false);
            setShowModeSelect(true);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* How To Play Modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Pause Menu Modal */}
      {showPause && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onSettings={() => setShowSettings(true)}
          onGarage={handleOpenGarageFromGame}
          onMainMenu={handleExitToMenu}
        />
      )}

      {/* Race Finish / Results Modal */}
      {telemetry.modeFinished && (
        <ResultsModal
          telemetry={telemetry}
          mode={currentMode}
          onRetry={handleRestart}
          onGarage={handleOpenGarageFromGame}
          onMainMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}
