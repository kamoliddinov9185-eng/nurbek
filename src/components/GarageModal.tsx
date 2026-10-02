import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  Paintbrush,
  Disc,
  Sparkles,
  Zap,
  Gauge,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { PlayerProfile, CarDefinition, CarCustomization } from '../types/game';
import { CARS_DATA, UPGRADE_PRICES } from '../data/cars';
import { GarageViewer } from '../game/GarageViewer';
import { soundEngine } from '../audio/SoundSystem';

interface GarageModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
  onClose: () => void;
  onDriveCar: (carId: string) => void;
}

type TabType = 'SPECS' | 'PAINT' | 'WHEELS' | 'AERO' | 'PERFORMANCE';

export const GarageModal: React.FC<GarageModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onDriveCar,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GarageViewer | null>(null);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = CARS_DATA.findIndex((c) => c.id === profile.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<TabType>('SPECS');

  const currentCar = CARS_DATA[currentIndex];
  const isUnlocked = profile.unlockedCars.includes(currentCar.id);
  const isSelected = profile.selectedCarId === currentCar.id;

  // Local copy of customizations
  const carCustom = profile.customizations[currentCar.id] || {
    paintColor: currentCar.baseColor,
    finish: 'metallic' as const,
    wheelStyle: '5-spoke' as const,
    wheelColor: '#cbd5e1',
    windowTint: 'rgba(15, 23, 42, 0.75)',
    underglow: 'none',
    spoiler: 'none' as const,
    upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0, suspension: 0, nitro: 0 },
  };

  // Initialize 3D garage viewer
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new GarageViewer(containerRef.current);
    viewerRef.current = viewer;
    viewer.displayCar(currentCar, carCustom);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Update displayed car when car index changes
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.displayCar(currentCar, carCustom);
    }
  }, [currentIndex]);

  const changeCar = (dir: -1 | 1) => {
    soundEngine.playClick();
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return CARS_DATA.length - 1;
      if (next >= CARS_DATA.length) return 0;
      return next;
    });
  };

  const handleSelectCar = () => {
    soundEngine.playClick();
    const updated = { ...profile, selectedCarId: currentCar.id };
    onUpdateProfile(updated);
  };

  const handleBuyCar = () => {
    if (profile.money < currentCar.price) return;
    soundEngine.playVictoryFanfare();
    const updated: PlayerProfile = {
      ...profile,
      money: profile.money - currentCar.price,
      unlockedCars: [...profile.unlockedCars, currentCar.id],
      selectedCarId: currentCar.id,
    };
    onUpdateProfile(updated);
  };

  const updateCustomization = (changes: Partial<CarCustomization>) => {
    soundEngine.playClick();
    const updatedCustom = { ...carCustom, ...changes };
    const updatedProfile: PlayerProfile = {
      ...profile,
      customizations: {
        ...profile.customizations,
        [currentCar.id]: updatedCustom,
      },
    };
    onUpdateProfile(updatedProfile);

    if (viewerRef.current) {
      viewerRef.current.updateCarCustomization(updatedCustom, currentCar);
    }
  };

  const handleUpgrade = (type: keyof typeof UPGRADE_PRICES) => {
    const currentLevel = carCustom.upgrades[type] || 0;
    if (currentLevel >= 3) return;

    const cost = UPGRADE_PRICES[type][currentLevel];
    if (profile.money < cost) return;

    soundEngine.playClick();
    const updatedUpgrades = {
      ...carCustom.upgrades,
      [type]: currentLevel + 1,
    };

    const updatedCustom = { ...carCustom, upgrades: updatedUpgrades };
    const updatedProfile: PlayerProfile = {
      ...profile,
      money: profile.money - cost,
      customizations: {
        ...profile.customizations,
        [currentCar.id]: updatedCustom,
      },
    };
    onUpdateProfile(updatedProfile);
  };

  const paintPresets = [
    { label: 'Rosso Corsa', color: '#dc2626' },
    { label: 'Royal Blue', color: '#2563eb' },
    { label: 'Obsidian Black', color: '#18181b' },
    { label: 'Glacier Pearl', color: '#f8fafc' },
    { label: 'Electric Cyan', color: '#06b6d4' },
    { label: 'Acid Lime', color: '#84cc16' },
    { label: 'Sunburst Gold', color: '#eab308' },
    { label: 'Midnight Violet', color: '#7c3aed' },
    { label: 'Magno Grey', color: '#475569' },
  ];

  const underglowPresets = [
    { label: 'None', color: 'none' },
    { label: 'Electric Cyan', color: '#06b6d4' },
    { label: 'Neon Red', color: '#ef4444' },
    { label: 'Acid Green', color: '#22c55e' },
    { label: 'Ultra Violet', color: '#a855f7' },
    { label: 'Amber Gold', color: '#f59e0b' },
  ];

  const wheelColorPresets = [
    { label: 'Silver Chrome', color: '#e2e8f0' },
    { label: 'Champagne Gold', color: '#fbbf24' },
    { label: 'Matte Black', color: '#1e293b' },
    { label: 'Bronze', color: '#b45309' },
  ];

  // Upgrades calculation for stats display
  const up = carCustom.upgrades;
  const speedBonus = up.engine * 8 + up.turbo * 12;
  const accelBonus = (up.engine * 0.4 + up.turbo * 0.5).toFixed(1);
  const handleBonus = (up.suspension * 0.4 + up.tires * 0.4).toFixed(1);
  const brakeBonus = (up.brakes * 0.5).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden">
      {/* 3D Turntable Viewport (full background) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6 glass-panel border-b border-white/10 m-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
            <Gauge className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wider text-white">GARAGE & SHOWROOM</h1>
            <p className="text-xs text-slate-400 font-mono">
              Vehicle {currentIndex + 1} of {CARS_DATA.length}
            </p>
          </div>
        </div>

        {/* Currency & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg border border-white/10">
            <span className="text-xs text-slate-400 font-medium">FUNDS</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              ${profile.money.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Carousel Arrow Controls */}
      <div className="relative z-10 flex items-center justify-between px-6 pointer-events-none my-auto">
        <button
          onClick={() => changeCar(-1)}
          className="pointer-events-auto p-4 rounded-full glass-panel hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all shadow-xl"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={() => changeCar(1)}
          className="pointer-events-auto p-4 rounded-full glass-panel hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all shadow-xl"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Interface Dock */}
      <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-6 mb-2">
        <div className="glass-panel-glow rounded-2xl p-5 md:p-6 border border-white/15 shadow-2xl">
          {/* Car Title & Buy/Select Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>{currentCar.fictionalBrand}</span>
                <span>·</span>
                <span>{currentCar.category}</span>
                <span className="text-slate-400">({currentCar.inspiredBy})</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
                {currentCar.name}
              </h2>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isUnlocked ? (
                isSelected ? (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onDriveCar(currentCar.id);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-display text-lg font-bold tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                  >
                    <Check className="w-5 h-5" />
                    DRIVE NOW
                  </button>
                ) : (
                  <button
                    onClick={handleSelectCar}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-display text-lg font-bold tracking-wider active:scale-[0.98] transition-all"
                  >
                    SELECT VEHICLE
                  </button>
                )
              ) : (
                <button
                  onClick={handleBuyCar}
                  disabled={profile.money < currentCar.price}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-lg font-bold tracking-wider transition-all ${
                    profile.money >= currentCar.price
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  BUY FOR ${currentCar.price.toLocaleString()}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-4 pb-3 border-b border-white/5 overflow-x-auto">
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('SPECS');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'SPECS' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Specs
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('PAINT');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'PAINT' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Paint
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('WHEELS');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'WHEELS' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              Wheels
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('AERO');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'AERO' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Aero & Neon
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('PERFORMANCE');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'PERFORMANCE'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Performance Tuning
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="pt-4 min-h-[140px]">
            {activeTab === 'SPECS' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Top Speed</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {currentCar.stats.speed + speedBonus} km/h
                      {speedBonus > 0 && <span className="text-emerald-400 text-[10px]"> (+{speedBonus})</span>}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((currentCar.stats.speed + speedBonus) / 400) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Acceleration</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {(currentCar.stats.acceleration + Number(accelBonus)).toFixed(1)} / 10
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((currentCar.stats.acceleration + Number(accelBonus)) / 10) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Handling</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {(currentCar.stats.handling + Number(handleBonus)).toFixed(1)} / 10
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((currentCar.stats.handling + Number(handleBonus)) / 10) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Braking</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {(currentCar.stats.braking + Number(brakeBonus)).toFixed(1)} / 10
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((currentCar.stats.braking + Number(brakeBonus)) / 10) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PAINT' && (
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">BODY COLOR</span>
                  <div className="flex flex-wrap gap-2.5">
                    {paintPresets.map((p) => (
                      <button
                        key={p.color}
                        onClick={() => updateCustomization({ paintColor: p.color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          carCustom.paintColor === p.color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">PAINT FINISH</span>
                  <div className="flex gap-2">
                    {(['metallic', 'matte', 'gloss'] as const).map((finish) => (
                      <button
                        key={finish}
                        onClick={() => updateCustomization({ finish })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          carCustom.finish === finish
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'WHEELS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">RIM PATTERN</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '5-spoke', label: '5-Spoke Sport' },
                      { id: 'mesh', label: 'Multi-Spoke Mesh' },
                      { id: 'deep-dish', label: 'Deep Dish Tuner' },
                      { id: 'aerodisc', label: 'Aero Solid Disc' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => updateCustomization({ wheelStyle: w.id as any })}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all ${
                          carCustom.wheelStyle === w.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">WHEEL FINISH COLOR</span>
                  <div className="flex flex-wrap gap-2.5">
                    {wheelColorPresets.map((wc) => (
                      <button
                        key={wc.color}
                        onClick={() => updateCustomization({ wheelColor: wc.color })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                          carCustom.wheelColor === wc.color
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/20'
                            : 'border-white/10 text-slate-400 bg-white/5'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: wc.color }} />
                        {wc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'AERO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">REAR SPOILER WING</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'Clean Wingless' },
                      { id: 'ducktail', label: 'Ducktail Lip' },
                      { id: 'gt', label: 'GT Racing Wing' },
                      { id: 'massive', label: 'Track Massive Wing' },
                    ].map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => updateCustomization({ spoiler: sp.id as any })}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all ${
                          carCustom.spoiler === sp.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono mb-2 block">NEON UNDERGLOW</span>
                  <div className="flex flex-wrap gap-2">
                    {underglowPresets.map((ug) => (
                      <button
                        key={ug.color}
                        onClick={() => updateCustomization({ underglow: ug.color })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                          carCustom.underglow === ug.color
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/20'
                            : 'border-white/10 text-slate-400 bg-white/5'
                        }`}
                      >
                        {ug.color !== 'none' && (
                          <span
                            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: ug.color, color: ug.color }}
                          />
                        )}
                        {ug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PERFORMANCE' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'engine', name: 'Engine ECU & Camshaft', desc: '+12% Acceleration & Top Speed' },
                  { key: 'turbo', name: 'Twin Turbo Induction', desc: '+15% Boost & Blow-Off Sound' },
                  { key: 'brakes', name: 'Carbon Ceramic Brakes', desc: '+18% Stopping Deceleration' },
                  { key: 'tires', name: 'Semi-Slick Street Tires', desc: '+14% Lateral Cornering Grip' },
                  { key: 'suspension', name: 'Coilover Track Stance', desc: '+8% Roll & Pitch Control' },
                  { key: 'nitro', name: 'Twin Nitrous Oxide Tanks', desc: '+30% Duration & Fast Recharge' },
                ].map((item) => {
                  const level = carCustom.upgrades[item.key as keyof typeof UPGRADE_PRICES] || 0;
                  const isMax = level >= 3;
                  const price = !isMax ? UPGRADE_PRICES[item.key as keyof typeof UPGRADE_PRICES][level] : 0;
                  const canAfford = profile.money >= price;

                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-white">{item.name}</span>
                          <span className="text-[11px] font-mono text-cyan-400">Stage {level}/3</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3">{item.desc}</p>
                      </div>

                      <button
                        onClick={() => handleUpgrade(item.key as any)}
                        disabled={isMax || !canAfford}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all ${
                          isMax
                            ? 'bg-white/5 text-emerald-400 border border-emerald-500/30'
                            : canAfford
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md'
                            : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'MAXED OUT' : `UPGRADE ($${price.toLocaleString()})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
