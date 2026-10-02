import React from 'react';
import { X, Compass, Flag, Timer, Zap, Flame } from 'lucide-react';
import { GameMode } from '../types/game';
import { soundEngine } from '../audio/SoundSystem';

interface ModeSelectModalProps {
  onSelectMode: (mode: GameMode) => void;
  onClose: () => void;
}

interface ModeCard {
  id: GameMode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  rewardText: string;
  badgeColor: string;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({ onSelectMode, onClose }) => {
  const modes: ModeCard[] = [
    {
      id: 'FREE_DRIVE',
      title: 'Free Drive',
      subtitle: 'Open City Exploration',
      description: 'Freely explore the entire city, highway ramps, mountain tunnels, bridges, and stunt zones at your own pace.',
      icon: <Compass className="w-6 h-6 text-sky-400" />,
      rewardText: 'Cruise & Practice',
      badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    },
    {
      id: 'RACE',
      title: 'Circuit Race',
      subtitle: '2-Lap Championship',
      description: 'Grid up against dynamic AI opponents on the downtown street circuit. Overtake competitors and take the checkered flag.',
      icon: <Flag className="w-6 h-6 text-amber-400" />,
      rewardText: 'Up to $7,500 Prize',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    },
    {
      id: 'TIME_TRIAL',
      title: 'Time Trial',
      subtitle: 'Checkpoint Challenge',
      description: 'Race against the ticking clock. Hit every neon gate in sequence to add bonus seconds to your countdown timer.',
      icon: <Timer className="w-6 h-6 text-emerald-400" />,
      rewardText: 'Earn $5,000 + XP',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'TRAFFIC_RUN',
      title: 'Traffic Run',
      subtitle: 'Highway Near-Miss Rush',
      description: 'Weave through dense civilian highway traffic at breakneck speeds. Score huge cash multipliers with daring close calls.',
      icon: <Zap className="w-6 h-6 text-rose-400" />,
      rewardText: 'Combo Cash Multiplier',
      badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    },
    {
      id: 'DRIFT',
      title: 'Drift Attack',
      subtitle: 'Cornering Slip Master',
      description: 'Break traction and slide through tight intersections and roundabouts. Chain long continuous drifts to bank massive drift scores.',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      rewardText: 'Cash per Drift Point',
      badgeColor: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    },
  ];

  const handleSelect = (mode: GameMode) => {
    soundEngine.init();
    soundEngine.playClick();
    onSelectMode(mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl glass-panel-glow rounded-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-white/15">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-white">SELECT GAME MODE</h2>
            <p className="text-xs text-slate-400 font-mono">Choose your street driving objective</p>
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

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className="group text-left p-5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/[0.08] border border-white/10 hover:border-cyan-500/50 transition-all duration-150 flex flex-col justify-between active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {m.icon}
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${m.badgeColor}`}>
                    {m.rewardText}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {m.title}
                </h3>
                <h4 className="text-xs text-slate-400 font-medium mb-2">{m.subtitle}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                <span className="text-xs font-mono font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  DRIVE NOW →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
