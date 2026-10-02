import { PlayerProfile, GameSettings } from '../types/game';
import { CARS_DATA, createDefaultCustomization } from '../data/cars';

const PROFILE_KEY = 'ultimate_street_drive_profile_v1';
const SETTINGS_KEY = 'ultimate_street_drive_settings_v1';

export function getDefaultProfile(): PlayerProfile {
  const defaultCustomizations: PlayerProfile['customizations'] = {};
  CARS_DATA.forEach((car) => {
    defaultCustomizations[car.id] = createDefaultCustomization(car.baseColor);
  });

  return {
    money: 15000,
    xp: 0,
    level: 1,
    selectedCarId: 'cobalt-rs',
    unlockedCars: ['cobalt-rs'],
    customizations: defaultCustomizations,
    highScores: {
      driftScore: 0,
      trafficRunScore: 0,
      bestLapTime: 0,
      racesWon: 0,
    },
  };
}

export function getDefaultSettings(): GameSettings {
  return {
    quality: 'HIGH',
    timeOfDay: 'NIGHT',
    weather: 'CLEAR',
    masterVolume: 0.8,
    engineVolume: 0.7,
    sfxVolume: 0.8,
    steerSensitivity: 1.0,
    difficulty: 'NORMAL',
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all cars have custom entries
      const defaultProf = getDefaultProfile();
      CARS_DATA.forEach((car) => {
        if (!parsed.customizations[car.id]) {
          parsed.customizations[car.id] = defaultProf.customizations[car.id];
        }
      });
      return { ...defaultProf, ...parsed };
    }
  } catch {
    // safe fallback
  }
  return getDefaultProfile();
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...getDefaultSettings(), ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return getDefaultSettings();
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
