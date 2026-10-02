import { CarDefinition, CarCustomization } from '../types/game';

export const CARS_DATA: CarDefinition[] = [
  {
    id: 'cobalt-rs',
    name: 'Cobalt Apex RS',
    fictionalBrand: 'Apex Motors',
    inspiredBy: 'Chevrolet Cobalt',
    category: 'Sport Coupe',
    price: 0, // Starter car
    baseColor: '#2563eb', // Royal Blue
    description: 'A nimble front-wheel-drive sport compact. Responsive cornering and great fuel economy make it the ideal street starter.',
    stats: {
      speed: 215,
      acceleration: 6.8,
      handling: 7.2,
      braking: 6.5,
      weight: 1320,
      grip: 7.0,
    },
    engineSoundPitch: 0.95,
  },
  {
    id: 'supra-gt',
    name: 'Horizon Fujiwara GT',
    fictionalBrand: 'Horizon Works',
    inspiredBy: 'Toyota Supra',
    category: 'JDM Legend',
    price: 32000,
    baseColor: '#f97316', // Vibrant Orange
    description: 'Legendary 3.0L twin-scroll inline-6 turbo platform. Revered worldwide for staggering tuning potential and iconic street sound.',
    stats: {
      speed: 275,
      acceleration: 8.5,
      handling: 8.4,
      braking: 8.0,
      weight: 1510,
      grip: 8.2,
    },
    engineSoundPitch: 1.15,
  },
  {
    id: 'bavaria-m3',
    name: 'Bavaria M-Sport 3',
    fictionalBrand: 'Bavaria Motor Group',
    inspiredBy: 'BMW-style sports sedan',
    category: 'Executive Sedan',
    price: 45000,
    baseColor: '#0284c7', // Laguna Seca Blue
    description: 'The definitive rear-wheel-drive sport sedan. 50:50 weight distribution with surgical chassis dynamics and twin-turbo straight-six.',
    stats: {
      speed: 290,
      acceleration: 8.8,
      handling: 8.9,
      braking: 8.5,
      weight: 1640,
      grip: 8.7,
    },
    engineSoundPitch: 1.1,
  },
  {
    id: 'centauro-v12',
    name: 'Centauro SV12',
    fictionalBrand: 'Centauro Automobili',
    inspiredBy: 'Lamborghini-style supercar',
    category: 'Supercar',
    price: 165000,
    baseColor: '#eab308', // Giallo Yellow
    description: 'Razor-sharp Italian wedge silhouette powered by a screaming naturally aspirated 6.5L V12 with all-wheel drive and active aerodynamics.',
    stats: {
      speed: 350,
      acceleration: 9.8,
      handling: 9.4,
      braking: 9.6,
      weight: 1520,
      grip: 9.5,
    },
    engineSoundPitch: 1.45,
  },
  {
    id: 'stuttgart-amg',
    name: 'Silver Arrow C63',
    fictionalBrand: 'Stuttgart Star',
    inspiredBy: 'Mercedes-style performance sedan',
    category: 'Executive Sedan',
    price: 58000,
    baseColor: '#64748b', // Selenite Grey Magno
    description: 'Handcrafted 4.0L biturbo V8 packed into a muscular executive body. Tremendous straight-line torque with a deep intoxicating exhaust growl.',
    stats: {
      speed: 305,
      acceleration: 9.0,
      handling: 8.2,
      braking: 8.8,
      weight: 1720,
      grip: 8.4,
    },
    engineSoundPitch: 0.85,
  },
  {
    id: 'carrera-911',
    name: 'Carrera 900 RS',
    fictionalBrand: 'Stuttgart Rennsport',
    inspiredBy: 'Porsche-style sports car',
    category: 'Sport Coupe',
    price: 85000,
    baseColor: '#dc2626', // Guards Red
    description: 'Iconic rear-engine teardrop profile with high-revving flat-six engine. Incredible rear-axle traction and corner exit trajectory.',
    stats: {
      speed: 318,
      acceleration: 9.3,
      handling: 9.6,
      braking: 9.4,
      weight: 1440,
      grip: 9.3,
    },
    engineSoundPitch: 1.3,
  },
  {
    id: 'yokohama-gtr',
    name: 'Yokohama GT-R 34',
    fictionalBrand: 'Yokohama Works',
    inspiredBy: 'Nissan-style JDM sports car',
    category: 'JDM Legend',
    price: 72000,
    baseColor: '#3b82f6', // Bayside Blue
    description: 'All-wheel drive computer-governed torque vectoring with twin-turbo power. Renowned as the track predator that conquered street circuits.',
    stats: {
      speed: 300,
      acceleration: 9.1,
      handling: 9.0,
      braking: 8.7,
      weight: 1560,
      grip: 9.2,
    },
    engineSoundPitch: 1.2,
  },
  {
    id: 'stallion-v8',
    name: 'Detroit Stallion GT',
    fictionalBrand: 'Detroit Motors',
    inspiredBy: 'Ford Mustang-style muscle car',
    category: 'Muscle',
    price: 38000,
    baseColor: '#10b981', // Grabber Green
    description: 'Classic American fastback proportions with a 5.0L cross-plane V8. Outstanding tire-spinning burnouts and visceral raw muscle presence.',
    stats: {
      speed: 280,
      acceleration: 8.4,
      handling: 7.7,
      braking: 7.8,
      weight: 1760,
      grip: 7.9,
    },
    engineSoundPitch: 0.8,
  },
  {
    id: 'daytona-ss',
    name: 'Daytona SS 69',
    fictionalBrand: 'Daytona Racing',
    inspiredBy: 'Chevrolet Camaro-style muscle car',
    category: 'Muscle',
    price: 42000,
    baseColor: '#f43f5e', // Hot Rod Crimson
    description: 'Broad aggressive widebody muscle stance with vented hood and massive rear contact patches. Pure American road presence.',
    stats: {
      speed: 285,
      acceleration: 8.6,
      handling: 7.9,
      braking: 8.1,
      weight: 1740,
      grip: 8.0,
    },
    engineSoundPitch: 0.82,
  },
  {
    id: 'cyberion-ev',
    name: 'Cyberion Hyper-EV',
    fictionalBrand: 'Cyberion Tech',
    inspiredBy: 'Futuristic electric sports car',
    category: 'Hyper EV',
    price: 220000,
    baseColor: '#06b6d4', // Cyan Neon Metallic
    description: 'Next-gen quad-motor torque vectoring hypercar. Instantaneous 0 RPM peak torque, aerodynamic active tunnels, and ultra-low center of gravity.',
    stats: {
      speed: 370,
      acceleration: 10.0,
      handling: 9.7,
      braking: 9.8,
      weight: 1680,
      grip: 9.8,
    },
    engineSoundPitch: 1.8,
  },
];

export function createDefaultCustomization(baseColor: string): CarCustomization {
  return {
    paintColor: baseColor,
    finish: 'metallic',
    wheelStyle: '5-spoke',
    wheelColor: '#d1d5db',
    windowTint: 'rgba(15, 23, 42, 0.75)',
    underglow: 'none',
    spoiler: 'none',
    upgrades: {
      engine: 0,
      turbo: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      nitro: 0,
    },
  };
}

export const UPGRADE_PRICES = {
  engine: [3000, 7500, 15000],
  turbo: [4000, 9000, 18000],
  brakes: [2500, 5500, 12000],
  tires: [2000, 5000, 11000],
  suspension: [2200, 5200, 10500],
  nitro: [3500, 8000, 16000],
};
