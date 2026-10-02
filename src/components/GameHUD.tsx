import React, { useRef, useEffect } from 'react';
import { Camera, Pause, Zap, Flame, Trophy, Timer, ArrowUpCircle } from 'lucide-react';
import { GameTelemetry, GameEngine } from '../game/GameEngine';
import { GameMode } from '../types/game';
import { soundEngine } from '../audio/SoundSystem';

interface GameHUDProps {
  telemetry: GameTelemetry;
  mode: GameMode;
  onPause: () => void;
  onCycleCamera: () => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  mode,
  onPause,
  onCycleCamera,
  engineRef,
  minimapCanvasRef,
}) => {
  // Mobile virtual touch handlers
  const handleTouchStart = (
    action: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitro' | 'jump'
  ) => {
    soundEngine.init();
    if (engineRef.current) {
      engineRef.current.setVirtualControl(action, true);
    }
  };

  const handleTouchEnd = (
    action: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitro' | 'jump'
  ) => {
    if (engineRef.current) {
      engineRef.current.setVirtualControl(action, false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden font-display">
      {/* Top Bar Overlay */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Mode / Standings / Laps */}
        <div className="flex flex-col gap-2">
          {mode === 'RACE' && (
            <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-mono uppercase">POS</span>
                <span className="text-2xl font-bold text-amber-400 font-mono">
                  {telemetry.racePosition}
                  <span className="text-sm text-slate-400">/4</span>
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-mono uppercase">LAP</span>
                <span className="text-xl font-bold text-white font-mono">
                  {telemetry.currentLap}
                  <span className="text-xs text-slate-400">/{telemetry.totalLaps}</span>
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-sm">
                <Timer className="w-4 h-4" />
                <span>{telemetry.raceTime.toFixed(1)}s</span>
              </div>
            </div>
          )}

          {mode === 'TIME_TRIAL' && (
            <div className="glass-panel px-5 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-3 shadow-lg">
              <Timer className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">TIME REMAINING</span>
                <span
                  className={`text-2xl font-bold font-mono ${
                    telemetry.timeTrialRemaining <= 10 ? 'text-red-400 animate-bounce' : 'text-emerald-400'
                  }`}
                >
                  {telemetry.timeTrialRemaining}s
                </span>
              </div>
            </div>
          )}

          {mode === 'TRAFFIC_RUN' && (
            <div className="glass-panel px-4 py-2.5 rounded-xl border border-rose-500/30 flex items-center gap-3 shadow-lg">
              <Zap className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">TRAFFIC BONUS</span>
                <span className="text-xl font-bold text-rose-400 font-mono">
                  ${telemetry.trafficScore.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {mode === 'DRIFT' && (
            <div className="glass-panel px-4 py-2.5 rounded-xl border border-orange-500/30 flex items-center gap-3 shadow-lg">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">DRIFT SCORE</span>
                <span className="text-xl font-bold text-orange-400 font-mono">
                  {telemetry.driftScore.toLocaleString()} PTS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Right: Jump, Camera & Pause Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Jump Button */}
          <button
            onClick={() => {
              soundEngine.init();
              if (engineRef.current) engineRef.current.triggerJump();
            }}
            className="p-3 rounded-xl glass-panel hover:bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
            title="Jump Car (F / J)"
          >
            <ArrowUpCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-mono hidden md:inline font-bold">JUMP [F]</span>
          </button>

          <button
            onClick={onCycleCamera}
            className="p-3 rounded-xl glass-panel hover:bg-white/10 text-white border border-white/10 active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
            title="Cycle Camera (C)"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono hidden md:inline">[C]</span>
          </button>

          <button
            onClick={onPause}
            className="p-3 rounded-xl glass-panel hover:bg-white/10 text-white border border-white/10 active:scale-95 transition-all shadow-lg"
            title="Pause Game (ESC)"
          >
            <Pause className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Center Screen: Countdown & Live Multipliers Popups */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        {telemetry.countdown !== null && (
          <div className="animate-scale-in">
            <span className="text-7xl md:text-9xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-blue-600 drop-shadow-[0_0_35px_rgba(6,182,212,0.8)]">
              {telemetry.countdown === 0 ? 'GO!' : telemetry.countdown}
            </span>
          </div>
        )}

        {/* Live Drift Multiplier Banner */}
        {telemetry.isDrifting && (
          <div className="glass-panel-glow px-6 py-2 rounded-2xl border border-orange-500/40 text-orange-400 flex items-center gap-3 animate-pulse shadow-xl mt-4">
            <Flame className="w-6 h-6 fill-orange-400 text-orange-500" />
            <div className="text-left">
              <span className="text-xs font-mono font-bold block tracking-wider uppercase">DRIFT COMBO</span>
              <span className="text-2xl font-black font-mono">
                {telemetry.driftScore} <span className="text-base text-yellow-300">x{telemetry.driftMultiplier}</span>
              </span>
            </div>
          </div>
        )}

        {/* Near Miss / Jump Alert */}
        {telemetry.lastNearMissNotice && (
          <div className="glass-panel px-5 py-2.5 rounded-xl border border-yellow-400/50 text-yellow-300 font-mono font-bold text-sm tracking-widest animate-bounce mt-4 shadow-xl">
            {telemetry.lastNearMissNotice}
          </div>
        )}
      </div>

      {/* Bottom Dock: Minimap (Left) + Speedometer & Gauges (Right) + Mobile Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Minimap (Bottom Left) */}
        <div className="flex flex-col gap-2">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden glass-panel-glow border border-cyan-500/30 p-1 relative shadow-2xl">
            <canvas
              ref={minimapCanvasRef as React.RefObject<HTMLCanvasElement>}
              width={180}
              height={180}
              className="w-full h-full rounded-xl bg-slate-950"
            />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded">
              GPS RADAR
            </div>
          </div>
        </div>

        {/* Controls Info Banner (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 glass-panel px-4 py-2 rounded-xl text-xs font-mono text-slate-300 border border-white/10 mb-1">
          <span>WASD / Arrows: Drive</span>
          <span>·</span>
          <span className="text-yellow-400 font-bold">F / J: JUMP</span>
          <span>·</span>
          <span className="text-orange-400">Space: Drift</span>
          <span>·</span>
          <span className="text-cyan-400">Shift: Nitro</span>
          <span>·</span>
          <span>R: Reset</span>
        </div>

        {/* Speedometer & RPM Cluster (Bottom Right) */}
        <div className="glass-panel-glow rounded-2xl p-4 md:p-5 border border-cyan-500/30 flex flex-col items-center shadow-2xl min-w-[200px] md:min-w-[240px]">
          {/* Speed Digital readout */}
          <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight drop-shadow-md">
              {telemetry.speedKmh}
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">KM/H</span>
          </div>

          {/* RPM Arc Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden my-2 border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                telemetry.rpm > 0.85
                  ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500'
              }`}
              style={{ width: `${Math.min(100, telemetry.rpm * 100)}%` }}
            />
          </div>

          {/* Gear & Nitro Indicators */}
          <div className="flex items-center justify-between w-full pt-1 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">GEAR</span>
              <span className="text-lg font-bold text-cyan-300">
                {telemetry.gear === 0 ? 'N' : telemetry.gear}
              </span>
            </div>

            {/* Nitro Gauge */}
            <div className="flex items-center gap-1.5">
              <Zap
                className={`w-4 h-4 ${telemetry.nitro > 20 ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`}
              />
              <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all"
                  style={{ width: `${telemetry.nitro}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual On-Screen Mobile Touch Controls (Always available & styled for touch screens) */}
      <div className="flex items-center justify-between w-full mt-3 pointer-events-auto md:hidden">
        {/* Left / Right Steering */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={() => handleTouchEnd('left')}
            className="w-14 h-14 rounded-2xl glass-panel text-white font-bold text-xl active:bg-cyan-500/40 border border-white/20 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            ◀
          </button>

          <button
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={() => handleTouchEnd('right')}
            className="w-14 h-14 rounded-2xl glass-panel text-white font-bold text-xl active:bg-cyan-500/40 border border-white/20 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            ▶
          </button>
        </div>

        {/* Handbrake, Jump, Nitro & Gas/Brake Pedals */}
        <div className="flex items-center gap-2">
          {/* Jump Button */}
          <button
            onTouchStart={() => handleTouchStart('jump')}
            onMouseDown={() => handleTouchStart('jump')}
            className="w-12 h-12 rounded-xl glass-panel text-yellow-300 active:bg-yellow-500/30 border border-yellow-400/40 active:scale-95 transition-all flex flex-col items-center justify-center shadow-lg"
          >
            <ArrowUpCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-[8px] font-mono font-bold mt-0.5">JUMP</span>
          </button>

          {/* Handbrake / Drift */}
          <button
            onTouchStart={() => handleTouchStart('handbrake')}
            onTouchEnd={() => handleTouchEnd('handbrake')}
            onMouseDown={() => handleTouchStart('handbrake')}
            onMouseUp={() => handleTouchEnd('handbrake')}
            className="w-12 h-12 rounded-xl glass-panel text-orange-400 text-xs font-mono font-bold active:bg-orange-500/30 border border-orange-500/30 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            DRIFT
          </button>

          {/* Nitro */}
          <button
            onTouchStart={() => handleTouchStart('nitro')}
            onTouchEnd={() => handleTouchEnd('nitro')}
            onMouseDown={() => handleTouchStart('nitro')}
            onMouseUp={() => handleTouchEnd('nitro')}
            className="w-12 h-12 rounded-xl glass-panel text-cyan-400 active:bg-cyan-500/30 border border-cyan-400/40 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            <Zap className="w-5 h-5 fill-cyan-400" />
          </button>

          {/* Brake / Reverse */}
          <button
            onTouchStart={() => handleTouchStart('backward')}
            onTouchEnd={() => handleTouchEnd('backward')}
            onMouseDown={() => handleTouchStart('backward')}
            onMouseUp={() => handleTouchEnd('backward')}
            className="w-14 h-14 rounded-2xl glass-panel text-red-400 font-bold active:bg-red-500/40 border border-red-500/30 active:scale-95 transition-all flex items-center justify-center shadow-lg text-xs font-mono"
          >
            BRAKE
          </button>

          {/* Accelerate */}
          <button
            onTouchStart={() => handleTouchStart('forward')}
            onTouchEnd={() => handleTouchEnd('forward')}
            onMouseDown={() => handleTouchStart('forward')}
            onMouseUp={() => handleTouchEnd('forward')}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-white font-black active:brightness-125 border border-cyan-300/40 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] text-sm font-mono"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};

