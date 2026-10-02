import React, { useEffect, useState } from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing 3D Simulation Engine...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 25 && next < 55) {
          setLoadingText('Building Open World City & Highways...');
        } else if (next >= 55 && next < 85) {
          setLoadingText('Tuning Procedural Vehicle Physics & AI...');
        } else if (next >= 85 && next < 100) {
          setLoadingText('Calibrating Dynamic Lighting & Sound Synthesizer...');
        } else if (next >= 100) {
          clearInterval(interval);
          setLoadingText('Ready for Street Dominance');
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleStartPrompt = () => {
    soundEngine.init();
    soundEngine.playClick();
  };

  return (
    <div
      onClick={handleStartPrompt}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black text-white select-none px-6"
    >
      <div className="flex flex-col items-center max-w-lg w-full text-center">
        {/* Logo / Badge */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <Gauge className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 mb-2 drop-shadow-[0_2px_15px_rgba(6,182,212,0.4)]">
          ULTIMATE STREET DRIVE 3D
        </h1>

        <p className="text-xs md:text-sm text-cyan-400/80 tracking-widest uppercase mb-10 font-semibold">
          High-Octane 3D Open World Racing
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-900/80 border border-white/10 rounded-full h-3 p-0.5 overflow-hidden mb-4 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            {loadingText}
          </span>
          <span className="text-cyan-400 font-bold">{Math.min(progress, 100)}%</span>
        </div>

        <p className="text-[11px] text-slate-500 mt-8">
          Click or press any key to engage audio engine
        </p>
      </div>
    </div>
  );
};
