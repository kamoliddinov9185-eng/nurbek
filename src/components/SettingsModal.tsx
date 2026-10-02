import React from 'react';
import { X, Sun, Moon, CloudRain, CloudFog, Sliders, Volume2, Shield } from 'lucide-react';
import { GameSettings, GraphicsQuality, TimeOfDay, WeatherType, AIDifficulty } from '../types/game';
import { soundEngine } from '../audio/SoundSystem';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleUpdate = (partial: Partial<GameSettings>) => {
    soundEngine.playClick();
    const updated = { ...settings, ...partial };
    onUpdateSettings(updated);

    if (
      partial.masterVolume !== undefined ||
      partial.engineVolume !== undefined ||
      partial.sfxVolume !== undefined
    ) {
      soundEngine.setVolumes(
        updated.masterVolume,
        updated.engineVolume,
        updated.sfxVolume
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg glass-panel-glow rounded-2xl p-6 md:p-8 border border-white/15 flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-2xl font-bold tracking-wider text-white">GAME SETTINGS</h2>
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

        <div className="flex flex-col gap-6">
          {/* Graphics Quality */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              GRAPHICS QUALITY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => handleUpdate({ quality: q })}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    settings.quality === q
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              TIME OF DAY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'DAY', label: 'Daylight', icon: <Sun className="w-4 h-4 text-amber-400" /> },
                { id: 'SUNSET', label: 'Sunset', icon: <Sun className="w-4 h-4 text-orange-400" /> },
                { id: 'NIGHT', label: 'Neon Night', icon: <Moon className="w-4 h-4 text-cyan-400" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleUpdate({ timeOfDay: t.id as TimeOfDay })}
                  className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    settings.timeOfDay === t.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              WEATHER CONDITIONS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CLEAR', label: 'Clear Sky', icon: <Sun className="w-4 h-4 text-sky-400" /> },
                { id: 'RAIN', label: 'Rain (Wet Road)', icon: <CloudRain className="w-4 h-4 text-blue-400" /> },
                { id: 'FOG', label: 'Dense Fog', icon: <CloudFog className="w-4 h-4 text-slate-400" /> },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleUpdate({ weather: w.id as WeatherType })}
                  className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    settings.weather === w.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {w.icon}
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              AI OPPONENT DIFFICULTY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'NORMAL', 'HARD'] as AIDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleUpdate({ difficulty: d })}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    settings.difficulty === d
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Steering Sensitivity Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-slate-400 uppercase">STEERING SENSITIVITY</span>
              <span className="text-cyan-400 font-bold">{settings.steerSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={settings.steerSensitivity}
              onChange={(e) => handleUpdate({ steerSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Audio Volumes */}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              AUDIO VOLUMES
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Master Volume</span>
                <span className="text-cyan-400">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleUpdate({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Engine Sound</span>
                <span className="text-cyan-400">{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => handleUpdate({ engineVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Tire & Crash SFX</span>
                <span className="text-cyan-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleUpdate({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
