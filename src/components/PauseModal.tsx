import React from 'react';
import { Play, RotateCcw, Wrench, Home, Settings as SettingsIcon } from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onGarage: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSettings,
  onGarage,
  onMainMenu,
}) => {
  const handleClick = (action: () => void) => {
    soundEngine.playClick();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-sm glass-panel-glow rounded-2xl p-6 border border-white/15 flex flex-col items-center text-center shadow-2xl">
        <h2 className="font-display text-3xl font-bold tracking-wider text-white mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 font-mono mb-6">Simulation suspended</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => handleClick(onResume)}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-display text-lg font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Play className="w-5 h-5 fill-white" />
            RESUME
          </button>

          <button
            onClick={() => handleClick(onRestart)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
            Restart Event
          </button>

          <button
            onClick={() => handleClick(onSettings)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            <SettingsIcon className="w-4 h-4 text-slate-300" />
            Settings
          </button>

          <button
            onClick={() => handleClick(onGarage)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            Garage & Tune
          </button>

          <button
            onClick={() => handleClick(onMainMenu)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-medium text-sm border border-red-500/20 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Exit To Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
