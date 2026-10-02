import React from 'react';
import { X, Keyboard, Smartphone, Compass, Trophy, Zap, Flame } from 'lucide-react';
import { soundEngine } from '../audio/SoundSystem';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl glass-panel-glow rounded-2xl p-6 md:p-8 border border-white/15 flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-white">HOW TO PLAY</h2>
            <p className="text-xs text-slate-400 font-mono">Controls, driving mechanics & progression guide</p>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 text-xs text-slate-300">
          {/* Desktop Controls */}
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-semibold uppercase mb-3">
              <Keyboard className="w-4 h-4" />
              DESKTOP KEYBOARD CONTROLS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'W / ↑', action: 'Accelerate (Gas)' },
                { key: 'S / ↓', action: 'Brake / Reverse' },
                { key: 'A / ←', action: 'Steer Left' },
                { key: 'D / →', action: 'Steer Right' },
                { key: 'F / J', action: 'Jump / Hop (Sakrash)' },
                { key: 'SPACE', action: 'Handbrake / Drift' },
                { key: 'SHIFT', action: 'Nitrous Boost' },
                { key: 'C', action: 'Change Camera' },
                { key: 'R', action: 'Reset Car On Track' },
                { key: 'Q / E', action: 'Turn Signals' },
                { key: 'ESC', action: 'Pause Game' },
              ].map((c) => (
                <div key={c.key} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                  <span className="font-mono font-bold text-white text-sm bg-white/10 px-2 py-0.5 rounded w-max mb-1">
                    {c.key}
                  </span>
                  <span className="text-[11px] text-slate-400">{c.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Virtual Controls */}
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-mono font-semibold uppercase mb-3">
              <Smartphone className="w-4 h-4" />
              MOBILE & TOUCH CONTROLS
            </div>
            <p className="text-slate-400 leading-relaxed mb-2">
              On touch devices, responsive virtual steering buttons (◀ / ▶) appear on the left, and dedicated Gas, Brake, Handbrake, and Nitro buttons appear on the right for seamless arcade racing.
            </p>
          </div>

          {/* Driving Techniques */}
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold uppercase mb-3">
              <Flame className="w-4 h-4" />
              DRIVING & DRIFT MECHANICS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Drift Scoring</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Turn sharply into a corner and tap <strong className="text-white">SPACE (Handbrake)</strong> to initiate a drift. Counter-steer and hold throttle to extend your drift and build combo multipliers up to 5x!
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Nitro Management</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Hold <strong className="text-white">SHIFT</strong> to unleash nitro thrust. Your tank slowly regenerates over time and charges faster during high-speed drifts.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Traffic Near-Misses</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  In <strong className="text-white">Traffic Run</strong> and <strong className="text-white">Free Drive</strong>, pass civilian vehicles within 3.5 meters at high speed without touching them to trigger near-miss cash bonuses!
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Garage Upgrades</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Reinvest your race winnings in the Garage to upgrade Engine, Turbo, Brakes, Tires, Suspension, and Nitrous tanks across all 10 cars.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            GOT IT, LET'S RACE
          </button>
        </div>
      </div>
    </div>
  );
};
