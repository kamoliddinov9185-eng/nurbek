export type GameMode = 'FREE_DRIVE' | 'RACE' | 'TIME_TRIAL' | 'TRAFFIC_RUN' | 'DRIFT';
export type TimeOfDay = 'DAY' | 'SUNSET' | 'NIGHT';
export type WeatherType = 'CLEAR' | 'RAIN' | 'FOG';
export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type CameraMode = 'CHASE' | 'CLOSE' | 'HOOD' | 'COCKPIT';
export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface CarStats {
  speed: number;       // Max speed (km/h)
  acceleration: number;// 0-100 time factor (higher = faster)
  handling: number;    // Turning response & agility (1-10)
  braking: number;     // Braking power (1-10)
  weight: number;      // kg
  grip: number;        // Lateral tire grip factor
}

export interface Upgrades {
  engine: number;      // 0 to 3
  turbo: number;       // 0 to 3
  brakes: number;      // 0 to 3
  tires: number;       // 0 to 3
  suspension: number;  // 0 to 3
  nitro: number;       // 0 to 3
}

export interface CarCustomization {
  paintColor: string;
  finish: 'metallic' | 'matte' | 'gloss';
  wheelStyle: '5-spoke' | 'mesh' | 'deep-dish' | 'aerodisc';
  wheelColor: string;
  windowTint: string;
  underglow: string;   // hex or 'none'
  spoiler: 'none' | 'ducktail' | 'gt' | 'massive';
  upgrades: Upgrades;
}

export interface CarDefinition {
  id: string;
  name: string;
  fictionalBrand: string;
  inspiredBy: string;
  category: 'Sport Coupe' | 'JDM Legend' | 'Executive Sedan' | 'Supercar' | 'Muscle' | 'Hyper EV';
  price: number;
  baseColor: string;
  description: string;
  stats: CarStats;
  engineSoundPitch: number;
}

export interface PlayerProfile {
  money: number;
  xp: number;
  level: number;
  selectedCarId: string;
  unlockedCars: string[];
  customizations: Record<string, CarCustomization>;
  highScores: {
    driftScore: number;
    trafficRunScore: number;
    bestLapTime: number;
    racesWon: number;
  };
}

export interface GameSettings {
  quality: GraphicsQuality;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  steerSensitivity: number;
  difficulty: AIDifficulty;
}

export interface RaceCheckpoint {
  x: number;
  z: number;
  radius: number;
  angle: number;
}

export interface RacerProgress {
  id: string;
  name: string;
  carId: string;
  color: string;
  lap: number;
  checkpointIndex: number;
  distanceToCheckpoint: number;
  totalDistance: number;
  position: number;
  finished: boolean;
  finishTime: number;
}
