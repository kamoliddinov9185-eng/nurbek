import React from 'react';
import { Play, Wrench, Settings as SettingsIcon, HelpCircle, Trophy, Zap, Volume2, VolumeX } from 'lucide-react';
import { PlayerProfile, GameSettings } from '../types/game';
import { CARS_DATA } from '../data/cars';
import { soundEngine } from '../audio/SoundSystem';

interface MainMenuProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onPlay: () => void;
  onGarage: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  settings,
  onPlay,
  onGarage,
  onSettings,
  onHowToPlay,
  onToggleMute,
  isMuted,
}) => {
  const currentCar = CARS_DATA.find((c) => c.id === profile.selectedCarId) || CARS_DATA[0];

  const handleClick = (action: () => void) => {
    soundEngine.init();
    soundEngine.playClick();
    action();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden bg-gradient-to-b from-slate-950/80 via-black/60 to-black/90 z-20">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto glass-panel rounded-xl px-6 py-3.5 border border-white/10 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-lg md:text-xl font-bold tracking-wider text-white">
              ULTIMATE STREET DRIVE 3D
            </h1>
          </div>
        </div>

        {/* Player Stats & Economy */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cash</span>
            <span className="font-mono text-base md:text-lg font-bold text-emerald-400">
              ${profile.money.toLocaleString()}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-5">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Level</span>
            <span className="font-mono text-base font-bold text-cyan-400">{profile.level}</span>
          </div>

          <button
            onClick={() => handleClick(onToggleMute)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Center Left: Action CTAs */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-8 my-auto">
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Main Action Buttons */}
          <button
            onClick={() => handleClick(onPlay)}
            className="group relative flex items-center justify-between px-8 py-5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 text-white font-display text-2xl font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-[0_0_35px_rgba(6,182,212,0.4)] border border-cyan-300/30 overflow-hidden"
          >
            <span className="flex items-center gap-3">
              <Play className="w-7 h-7 fill-white group-hover:translate-x-1 transition-transform" />
              START DRIVE
            </span>
            <span className="text-xs font-mono font-normal tracking-widest text-cyan-100 bg-white/20 px-2.5 py-1 rounded">
              ENTER CITY
            </span>
          </button>

          <button
            onClick={() => handleClick(onGarage)}
            className="group flex items-center justify-between px-8 py-4 rounded-xl glass-panel hover:bg-white/10 text-white font-display text-xl font-bold tracking-wider border border-white/15 active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-3 text-slate-200 group-hover:text-white">
              <Wrench className="w-6 h-6 text-cyan-400 group-hover:rotate-45 transition-transform" />
              GARAGE & TUNING
            </span>
            <span className="text-xs font-mono text-cyan-400">10 CARS</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleClick(onSettings)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm border border-white/10 transition-all active:scale-[0.98]"
            >
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              Settings
            </button>

            <button
              onClick={() => handleClick(onHowToPlay)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm border border-white/10 transition-all active:scale-[0.98]"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              How To Play
            </button>
          </div>
        </div>

        {/* Selected Car Showcase Card */}
        <div className="glass-panel-glow rounded-2xl p-6 w-full max-w-sm border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-semibold">
              Selected Vehicle
            </span>
            <span className="text-xs text-slate-400 font-mono">{currentCar.category}</span>
          </div>

          <h3 className="font-display text-2xl font-bold text-white mb-1">{currentCar.name}</h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">{currentCar.description}</p>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-5">
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <div className="text-slate-400 mb-1">Top Speed</div>
              <div className="font-mono text-sm font-bold text-white">{currentCar.stats.speed} km/h</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <div className="text-slate-400 mb-1">0-100 Rating</div>
              <div className="font-mono text-sm font-bold text-white">{currentCar.stats.acceleration} / 10</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <div className="text-slate-400 mb-1">Handling</div>
              <div className="font-mono text-sm font-bold text-white">{currentCar.stats.handling} / 10</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
              <div className="text-slate-400 mb-1">Braking</div>
              <div className="font-mono text-sm font-bold text-white">{currentCar.stats.braking} / 10</div>
            </div>
          </div>

          <button
            onClick={() => handleClick(onGarage)}
            className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-medium text-xs tracking-wider uppercase transition-colors"
          >
            Customize In Garage
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-white/5 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Races Won: {profile.highScores.racesWon}
          </span>
          <span>·</span>
          <span>Best Drift: {profile.highScores.driftScore.toLocaleString()} PTS</span>
        </div>
        <div>
          <span>Keyboard: WASD / Arrows · Space = Drift · Shift = Nitro</span>
        </div>
      </footer>
    </div>
  );
};
