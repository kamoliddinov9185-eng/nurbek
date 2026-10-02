import React from 'react';
import { Trophy, RotateCcw, Home, Wrench, Award, DollarSign } from 'lucide-react';
import { GameTelemetry } from '../game/GameEngine';
import { GameMode } from '../types/game';
import { soundEngine } from '../audio/SoundSystem';

interface ResultsModalProps {
  telemetry: GameTelemetry;
  mode: GameMode;
  onRetry: () => void;
  onGarage: () => void;
  onMainMenu: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  telemetry,
  mode,
  onRetry,
  onGarage,
  onMainMenu,
}) => {
  const results = telemetry.finishResults;
  if (!results) return null;

  const isWin = results.won || (mode !== 'RACE' && results.earnings > 0);

  const handleClick = (action: () => void) => {
    soundEngine.playClick();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md glass-panel-glow rounded-2xl p-6 md:p-8 border border-white/15 flex flex-col items-center text-center shadow-2xl animate-scale-in">
        {/* Victory Icon / Banner */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
            isWin
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
              : 'bg-slate-800 border-white/10 text-slate-400'
          }`}
        >
          {isWin ? <Trophy className="w-9 h-9" /> : <Award className="w-9 h-9" />}
        </div>

        <h2 className="font-display text-3xl font-black tracking-wider text-white mb-1">
          {isWin ? 'EVENT COMPLETE' : 'EVENT FINISHED'}
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-6">
          {mode === 'RACE'
            ? `Finished in Position #${results.position}`
            : mode === 'DRIFT'
            ? 'Drift Session Concluded'
            : mode === 'TRAFFIC_RUN'
            ? 'Traffic Run Survivor'
            : 'Time Trial Concluded'}
        </p>

        {/* Prize Money Callout */}
        <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-mono block uppercase">PRIZE EARNINGS</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                +${results.earnings.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
            +{Math.floor(results.earnings / 2)} XP
          </span>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 gap-3 w-full text-xs font-mono mb-6">
          <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-left">
            <span className="text-slate-400 block mb-1">Time Elapsed</span>
            <span className="text-sm font-bold text-white">{results.time.toFixed(1)}s</span>
          </div>

          {mode === 'DRIFT' ? (
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-left">
              <span className="text-slate-400 block mb-1">Total Drift</span>
              <span className="text-sm font-bold text-orange-400">{results.driftScore} PTS</span>
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-left">
              <span className="text-slate-400 block mb-1">Final Position</span>
              <span className="text-sm font-bold text-cyan-400">#{results.position} of 4</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => handleClick(onRetry)}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-display text-lg font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <RotateCcw className="w-5 h-5" />
            RACE AGAIN
          </button>

          <button
            onClick={() => handleClick(onGarage)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            Upgrade in Garage
          </button>

          <button
            onClick={() => handleClick(onMainMenu)}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
