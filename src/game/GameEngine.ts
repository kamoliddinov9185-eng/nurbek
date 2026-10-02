import * as THREE from 'three';
import { BuiltCar, CarBuilder } from './CarBuilder';
import { WorldBuilder, WorldBuildResult } from './WorldBuilder';
import {
  GameMode,
  TimeOfDay,
  WeatherType,
  CameraMode,
  PlayerProfile,
  GameSettings,
  RacerProgress,
} from '../types/game';
import { CARS_DATA } from '../data/cars';
import { soundEngine } from '../audio/SoundSystem';

export interface GameTelemetry {
  speedKmh: number;
  rpm: number;
  gear: number;
  nitro: number;
  driftScore: number;
  driftMultiplier: number;
  isDrifting: boolean;
  racePosition: number;
  currentLap: number;
  totalLaps: number;
  raceTime: number;
  countdown: number | null;
  timeTrialRemaining: number;
  trafficScore: number;
  nearMissCount: number;
  lastNearMissNotice: string | null;
  modeFinished: boolean;
  finishResults: {
    won: boolean;
    position: number;
    time: number;
    earnings: number;
    driftScore: number;
  } | null;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: WorldBuildResult;
  private playerCar: BuiltCar;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  // State
  private profile: PlayerProfile;
  private settings: GameSettings;
  private mode: GameMode;
  private isPaused: boolean = false;
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = performance.now();

  // Camera
  private cameraMode: CameraMode = 'CHASE';
  private cameraModeIndex: number = 0;
  private readonly cameraModes: CameraMode[] = ['CHASE', 'CLOSE', 'HOOD', 'COCKPIT'];

  // Vehicle Physics State
  private carPosition = new THREE.Vector3(0, 0.35, -200);
  private carRotation = 0; // heading in radians
  private carSpeed = 0; // m/s
  private carLateralSpeed = 0; // m/s
  private steerAngle = 0; // rad
  private currentGear = 1;
  private engineRpm = 0.15; // 0 to 1
  private nitroTank = 100; // 0 to 100
  private isNitroActive = false;
  private isHandbrake = false;
  private isDrifting = false;
  private driftScore = 0;
  private driftMultiplier = 1;
  private driftDuration = 0;

  // Vertical, Ramp & Jump Physics State
  private verticalVelocity = 0; // m/s
  private isGrounded = true;
  private airTime = 0;

  // Turn signals
  private turnSignalState: 'OFF' | 'LEFT' | 'RIGHT' | 'HAZARD' = 'OFF';
  private turnSignalTimer = 0;

  // Exhaust fire particles
  private nitroFlames: THREE.Mesh[] = [];

  // Tire smoke particle system
  private smokeParticles: { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 }[] = [];
  private smokeGeo: THREE.SphereGeometry;
  private smokeMat: THREE.MeshBasicMaterial;

  // Spark particles for collisions
  private sparkParticles: { mesh: THREE.Mesh; life: number; vel: THREE.Vector3 }[] = [];

  // Input states
  private keys: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
    jump: false,
  };

  // AI Opponents
  private aiCars: {
    builtCar: BuiltCar;
    pos: THREE.Vector3;
    rot: number;
    speed: number;
    checkpointIndex: number;
    lap: number;
    finished: boolean;
    finishTime: number;
    targetSpeed: number;
  }[] = [];

  // Civilian Traffic
  private trafficCars: {
    group: THREE.Group;
    pos: THREE.Vector3;
    speed: number;
    laneX: number;
    direction: number; // 1 = south, -1 = north
  }[] = [];

  // Race Mode State
  private raceStatus: 'COUNTDOWN' | 'RACING' | 'FINISHED' = 'COUNTDOWN';
  private countdownTimer = 3.9;
  private raceTime = 0;
  private currentCheckpointIndex = 0;
  private currentLap = 1;
  private readonly totalLaps = 2;
  private timeTrialTimer = 40.0;
  private trafficScore = 0;
  private nearMissCount = 0;
  private lastNearMissNotice: string | null = null;
  private nearMissNoticeTimer = 0;

  private finishResults: GameTelemetry['finishResults'] = null;

  // Minimap 2D canvas context
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;

  // Telemetry callback to React UI
  private onTelemetryUpdate?: (t: GameTelemetry) => void;
  private onSaveProfile?: (p: PlayerProfile) => void;

  constructor(
    container: HTMLElement,
    profile: PlayerProfile,
    settings: GameSettings,
    mode: GameMode,
    minimapCanvas: HTMLCanvasElement | null,
    onTelemetryUpdate?: (t: GameTelemetry) => void,
    onSaveProfile?: (p: PlayerProfile) => void
  ) {
    this.container = container;
    this.profile = profile;
    this.settings = settings;
    this.mode = mode;
    this.minimapCanvas = minimapCanvas;
    if (minimapCanvas) {
      this.minimapCtx = minimapCanvas.getContext('2d');
    }
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.onSaveProfile = onSaveProfile;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1200
    );

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.quality !== 'LOW',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'HIGH' ? 2 : 1.25));
    this.renderer.shadowMap.enabled = settings.quality === 'HIGH';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.5);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(100, 150, 80);
    this.dirLight.castShadow = settings.quality === 'HIGH';
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 400;
    this.dirLight.shadow.camera.left = -120;
    this.dirLight.shadow.camera.right = 120;
    this.dirLight.shadow.camera.top = 120;
    this.dirLight.shadow.camera.bottom = -120;
    this.scene.add(this.dirLight);

    // 5. Build World
    this.world = WorldBuilder.buildWorld(this.scene);
    this.world.updateWeather(settings.weather, settings.timeOfDay);
    this.applyTimeOfDayLighting(settings.timeOfDay);

    // 6. Build Player Car
    const carDef = CARS_DATA.find((c) => c.id === profile.selectedCarId) || CARS_DATA[0];
    const custom = profile.customizations[carDef.id] || {
      paintColor: carDef.baseColor,
      finish: 'metallic',
      wheelStyle: '5-spoke',
      wheelColor: '#d1d5db',
      windowTint: 'rgba(15, 23, 42, 0.75)',
      underglow: 'none',
      spoiler: 'none',
      upgrades: { engine: 0, turbo: 0, brakes: 0, tires: 0, suspension: 0, nitro: 0 },
    };

    this.playerCar = CarBuilder.buildCar(carDef, custom);
    this.scene.add(this.playerCar.root);

    // Initial player car positioning (strictly clamped to road ground level)
    if (this.mode === 'RACE') {
      const initY = this.getGroundHeight(2, -200);
      this.carPosition.set(2, initY, -200);
      this.carRotation = 0;
    } else {
      const initY = this.getGroundHeight(0, -160);
      this.carPosition.set(0, initY, -160);
      this.carRotation = 0;
    }
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.airTime = 0;
    this.playerCar.root.position.copy(this.carPosition);

    // 7. Setup Exhaust Nitro Flames
    this.setupNitroFlames();

    // 8. Setup Tire Smoke & Sparks
    this.smokeGeo = new THREE.SphereGeometry(0.35, 6, 6);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.45,
    });

    // 9. Setup Opponents & Traffic
    if (this.mode === 'RACE') {
      this.setupAIOpponents();
    }
    if (this.mode === 'TRAFFIC_RUN' || this.mode === 'FREE_DRIVE') {
      this.setupTraffic();
    }

    // 10. Start Audio
    soundEngine.init();
    soundEngine.startEngine(carDef.engineSoundPitch);

    // 11. Bind Event Listeners
    this.setupKeyboardListeners();
    window.addEventListener('resize', this.onResize);

    // 12. Run Game Loop
    this.loop();
  }

  private applyTimeOfDayLighting(timeOfDay: TimeOfDay) {
    if (timeOfDay === 'DAY') {
      this.scene.background = new THREE.Color(0x38bdf8);
      this.ambientLight.intensity = 0.55;
      this.hemiLight.intensity = 0.65;
      this.dirLight.intensity = 1.35;
      this.dirLight.color.set(0xfffbeb);
      this.dirLight.position.set(80, 160, 60);
    } else if (timeOfDay === 'SUNSET') {
      this.scene.background = new THREE.Color(0xd97706);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity = 0.45;
      this.dirLight.intensity = 1.0;
      this.dirLight.color.set(0xfb923c);
      this.dirLight.position.set(120, 40, -90);
    } else {
      // NIGHT
      this.scene.background = new THREE.Color(0x030712);
      this.ambientLight.intensity = 0.12;
      this.hemiLight.intensity = 0.2;
      this.dirLight.intensity = 0.25;
      this.dirLight.color.set(0x94a3b8);
      this.dirLight.position.set(-60, 120, -50);
    }
  }

  private setupNitroFlames() {
    const flameGeo = new THREE.ConeGeometry(0.08, 0.45, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });

    this.playerCar.exhaustPositions.forEach((pos) => {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.copy(pos);
      flame.visible = false;
      this.playerCar.bodyGroup.add(flame);
      this.nitroFlames.push(flame);
    });
  }

  private setupAIOpponents() {
    const aiArchetypes = [
      { id: 'supra-gt', color: '#ea580c', gridOffset: new THREE.Vector3(-4, 0.35, -188) },
      { id: 'bavaria-m3', color: '#0284c7', gridOffset: new THREE.Vector3(4, 0.35, -176) },
      { id: 'carrera-911', color: '#16a34a', gridOffset: new THREE.Vector3(-3.5, 0.35, -164) },
    ];

    aiArchetypes.forEach((archetype) => {
      const def = CARS_DATA.find((c) => c.id === archetype.id) || CARS_DATA[1];
      const custom = {
        paintColor: archetype.color,
        finish: 'metallic' as const,
        wheelStyle: '5-spoke' as const,
        wheelColor: '#cbd5e1',
        windowTint: 'rgba(15, 23, 42, 0.8)',
        underglow: 'none',
        spoiler: 'gt' as const,
        upgrades: { engine: 1, turbo: 1, brakes: 1, tires: 1, suspension: 1, nitro: 1 },
      };

      const built = CarBuilder.buildCar(def, custom);
      built.root.position.copy(archetype.gridOffset);
      this.scene.add(built.root);

      let targetSpeed = 240 / 3.6;
      if (this.settings.difficulty === 'EASY') targetSpeed = 190 / 3.6;
      if (this.settings.difficulty === 'HARD') targetSpeed = 280 / 3.6;

      this.aiCars.push({
        builtCar: built,
        pos: archetype.gridOffset.clone(),
        rot: 0,
        speed: 0,
        checkpointIndex: 0,
        lap: 1,
        finished: false,
        finishTime: 0,
        targetSpeed,
      });
    });
  }

  private setupTraffic() {
    const trafficColors = [0x94a3b8, 0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x64748b, 0xffffff];
    const lanePositions = [-6, -2, 2, 6];

    for (let i = 0; i < 18; i++) {
      const carGroup = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: trafficColors[Math.floor(Math.random() * trafficColors.length)],
        roughness: 0.4,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 4.2), bodyMat);
      body.position.y = 0.55;
      carGroup.add(body);

      const cabinMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.0), cabinMat);
      cabin.position.set(0, 1.05, -0.1);
      carGroup.add(cabin);

      // Wheels
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
      [
        [-0.9, 0.35, 1.3],
        [0.9, 0.35, 1.3],
        [-0.9, 0.35, -1.3],
        [0.9, 0.35, -1.3],
      ].forEach(([wx, wy, wz]) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx, wy, wz);
        carGroup.add(tire);
      });

      const lane = lanePositions[i % lanePositions.length];
      const direction = lane < 0 ? -1 : 1; // Left lanes travel south, right north
      const z = -240 + i * 28 + Math.random() * 8;
      const speed = 12 + Math.random() * 8; // m/s (45-70 km/h)

      carGroup.position.set(lane, 0, z);
      if (direction < 0) carGroup.rotation.y = Math.PI;

      this.scene.add(carGroup);
      this.trafficCars.push({
        group: carGroup,
        pos: new THREE.Vector3(lane, 0, z),
        speed,
        laneX: lane,
        direction,
      });
    }
  }

  // Keyboard input handlers
  private setupKeyboardListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.handbrake = true;
        break;
      case 'KeyF':
      case 'KeyJ':
        this.triggerJump();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.nitro = true;
        break;
      case 'KeyC':
        this.cycleCamera();
        break;
      case 'KeyR':
        this.resetCarPosition();
        break;
      case 'KeyQ':
        this.toggleTurnSignal('LEFT');
        break;
      case 'KeyE':
        this.toggleTurnSignal('RIGHT');
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.handbrake = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.nitro = false;
        break;
      case 'KeyF':
      case 'KeyJ':
        this.keys.jump = false;
        break;
    }
  };

  // Mobile virtual touch controls
  public setVirtualControl(
    action: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitro' | 'jump',
    active: boolean
  ) {
    if (action === 'jump') {
      if (active) this.triggerJump();
      return;
    }
    if (this.keys[action] !== undefined) {
      this.keys[action] = active;
    }
  }

  public triggerJump() {
    if (this.isGrounded) {
      this.verticalVelocity = 14.5;
      this.isGrounded = false;
      this.carPosition.y += 0.2;
      soundEngine.playJumpSound();
      this.spawnSparks(this.carPosition);
    }
  }

  public getGroundHeight(x: number, z: number): number {
    const baseGround = 0.35;

    // 1. Elevated Highway (x: -89 to -71)
    if (x >= -89 && x <= -71) {
      // Main elevated deck
      if (z >= -180 && z <= 180) {
        return 8.35;
      }
      // South Access Ramp
      if (z > 180 && z <= 250) {
        const ratio = 1 - (z - 180) / 70;
        return baseGround + ratio * 8.0;
      }
      // North Access Ramp
      if (z >= -250 && z < -180) {
        const ratio = 1 - (-180 - z) / 70;
        return baseGround + ratio * 8.0;
      }
    }

    // 2. City Center Stunt Ramp 1 (x: -7 to 7, z: -35 to -17)
    if (x >= -7 && x <= 7 && z >= -35 && z <= -17) {
      const progress = (z - -35) / 18;
      return baseGround + progress * 3.8;
    }

    // 3. East Ring Road Stunt Ramp 2 (x: 194 to 206, z: -50 to -34)
    if (x >= 194 && x <= 206 && z >= -50 && z <= -34) {
      const progress = (z - -50) / 16;
      return baseGround + progress * 3.5;
    }

    return baseGround;
  }

  private recordAirTimeBonus(time: number) {
    const bonus = Math.floor(time * 350);
    if (bonus >= 100) {
      this.profile.money += bonus;
      this.lastNearMissNotice = `BIG AIR JUMP! +$${bonus}`;
      this.nearMissNoticeTimer = performance.now();
      if (this.onSaveProfile) this.onSaveProfile(this.profile);
    }
  }

  public cycleCamera() {
    this.cameraModeIndex = (this.cameraModeIndex + 1) % this.cameraModes.length;
    this.cameraMode = this.cameraModes[this.cameraModeIndex];
    soundEngine.playClick();
  }

  private toggleTurnSignal(side: 'LEFT' | 'RIGHT') {
    if (this.turnSignalState === side) {
      this.turnSignalState = 'OFF';
    } else {
      this.turnSignalState = side;
    }
    soundEngine.playClick();
  }

  public resetCarPosition() {
    this.carSpeed = 0;
    this.carLateralSpeed = 0;
    this.steerAngle = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;

    // Place safely back onto the central roadway
    if (Math.abs(this.carPosition.x) > 20) {
      this.carPosition.x = Math.sign(this.carPosition.x) * 6;
    }
    this.carPosition.y = this.getGroundHeight(this.carPosition.x, this.carPosition.z);

    this.playerCar.root.position.copy(this.carPosition);
    this.playerCar.root.rotation.set(0, this.carRotation, 0);
    this.playerCar.bodyGroup.rotation.set(0, 0, 0);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Main game update loop
  private loop = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isPaused) {
      this.updateCountdown(dt);
      this.updatePhysics(dt);
      this.updateAIOpponents(dt);
      this.updateTraffic(dt);
      this.updateParticles(dt);
      this.updateTurnSignals(dt);
      this.updateWorld(now / 1000);
      this.updateCamera(dt);
      this.updateTelemetry(dt);
      this.renderMinimap();
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateCountdown(dt: number) {
    if (this.mode !== 'RACE' && this.mode !== 'TIME_TRIAL') {
      this.raceStatus = 'RACING';
      return;
    }

    if (this.raceStatus === 'COUNTDOWN') {
      const prevSec = Math.ceil(this.countdownTimer);
      this.countdownTimer -= dt;
      const currSec = Math.ceil(this.countdownTimer);

      if (prevSec !== currSec && currSec > 0 && currSec <= 3) {
        soundEngine.playCountdownBeep(false);
      }

      if (this.countdownTimer <= 0) {
        this.raceStatus = 'RACING';
        soundEngine.playCountdownBeep(true);
      }
    } else if (this.raceStatus === 'RACING') {
      this.raceTime += dt;
      if (this.mode === 'TIME_TRIAL') {
        this.timeTrialTimer -= dt;
        if (this.timeTrialTimer <= 0) {
          this.timeTrialTimer = 0;
          this.finishRace(false);
        }
      }
    }
  }

  private updatePhysics(dt: number) {
    const isRacingActive = this.raceStatus === 'RACING';
    const canDrive = isRacingActive && this.finishResults === null;

    const stats = this.playerCar.carDef.stats;
    const up = this.playerCar.customization.upgrades;

    // Upgrades calculation
    const accelBonus = 1 + up.engine * 0.12 + up.turbo * 0.15;
    const maxSpeedBonus = 1 + up.engine * 0.05 + up.turbo * 0.08;
    const brakeBonus = 1 + up.brakes * 0.18;
    const gripBonus = 1 + up.tires * 0.14 + up.suspension * 0.08;
    const isEV = this.playerCar.carDef.id === 'cyberion-ev';

    // Weather grip reduction
    const weatherGrip = this.settings.weather === 'RAIN' ? 0.72 : 1.0;
    const effectiveGrip = stats.grip * gripBonus * weatherGrip;

    // Nitro handling
    if (canDrive && this.keys.nitro && this.nitroTank > 0) {
      this.isNitroActive = true;
      this.nitroTank = Math.max(0, this.nitroTank - dt * (28 - up.nitro * 4));
      soundEngine.setNitroSound(true);
      this.nitroFlames.forEach((f) => (f.visible = true));
    } else {
      this.isNitroActive = false;
      this.nitroTank = Math.min(100, this.nitroTank + dt * 5.0);
      soundEngine.setNitroSound(false);
      this.nitroFlames.forEach((f) => (f.visible = false));
    }

    // Steering
    const steerSpeed = 3.5 * (this.settings.steerSensitivity || 1.0);
    const speedKmh = Math.abs(this.carSpeed) * 3.6;
    // Speed-dependent steering reduction
    const speedDamping = Math.max(0.28, 1.0 - Math.min(speedKmh / 350, 0.72));

    let targetSteer = 0;
    if (canDrive) {
      if (this.keys.left) targetSteer += 0.58 * speedDamping;
      if (this.keys.right) targetSteer -= 0.58 * speedDamping;
    }

    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, dt * steerSpeed);

    // Front wheels visual steering pivot
    this.playerCar.frontLeftWheelPivot.rotation.y = this.steerAngle;
    this.playerCar.frontRightWheelPivot.rotation.y = this.steerAngle;

    // Throttle & Braking
    const maxSpeedMs = ((stats.speed * maxSpeedBonus) / 3.6) * (this.isNitroActive ? 1.25 : 1.0);
    const accelRate = (12.0 + stats.acceleration * 2.2) * accelBonus * (this.isNitroActive ? 1.6 : 1.0);
    const brakeRate = (18.0 + stats.braking * 2.5) * brakeBonus;
    const handbrakeRate = 28.0;
    const dragCoeff = 0.0016;

    let throttle = 0;
    if (canDrive) {
      if (this.keys.forward) throttle = 1.0;
      else if (this.keys.backward) throttle = -0.5;
    }

    this.isHandbrake = canDrive && this.keys.handbrake;

    // Apply acceleration
    if (throttle > 0) {
      if (this.carSpeed < maxSpeedMs) {
        this.carSpeed += throttle * accelRate * dt;
      }
    } else if (throttle < 0) {
      if (this.carSpeed > 0.5) {
        // Braking while going forward
        this.carSpeed -= brakeRate * dt;
      } else {
        // Reverse
        if (this.carSpeed > -12) {
          this.carSpeed += throttle * accelRate * 0.45 * dt;
        }
      }
    } else {
      // Natural rolling friction & air drag
      this.carSpeed -= this.carSpeed * 0.45 * dt;
    }

    // Handbrake
    if (this.isHandbrake) {
      this.carSpeed -= Math.sign(this.carSpeed) * handbrakeRate * dt;
      if (Math.abs(this.carSpeed) < 0.2) this.carSpeed = 0;
    }

    // Air resistance
    this.carSpeed -= Math.sign(this.carSpeed) * (this.carSpeed * this.carSpeed) * dragCoeff * dt;

    // Brake Lights Emission
    const isBraking = (throttle < 0 && this.carSpeed > 1) || this.isHandbrake;
    this.playerCar.brakeLights.forEach((bl) => {
      const mat = bl.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isBraking ? 2.5 : 0.6;
    });

    // Turning & Drift Dynamics
    const turnRadius = 2.4 / Math.max(Math.tan(Math.abs(this.steerAngle)), 0.001);
    let yawRate = (this.carSpeed / turnRadius) * Math.sign(this.steerAngle);

    // Lateral slip calculation
    const slipThreshold = (effectiveGrip * 0.7) / (this.isHandbrake ? 2.2 : 1.0);
    const centripetalForce = Math.abs(this.carSpeed * yawRate);

    if (centripetalForce > slipThreshold && Math.abs(this.carSpeed) > 8) {
      this.isDrifting = true;
      this.driftDuration += dt;
      const driftAdd = Math.floor(Math.abs(this.carSpeed) * 3.5 * dt * this.driftMultiplier);
      this.driftScore += driftAdd;

      if (this.driftDuration > 2.0 && this.driftMultiplier < 5) {
        this.driftMultiplier = Math.min(5, Math.floor(this.driftDuration));
      }

      // Add tire screech and tire smoke
      soundEngine.updateTireScreech(Math.min(1.0, centripetalForce / slipThreshold));
      this.spawnTireSmoke();
    } else {
      this.isDrifting = false;
      this.driftDuration = 0;
      soundEngine.updateTireScreech(0);
      if (Math.abs(this.carSpeed) < 3) {
        this.driftMultiplier = 1;
      }
    }

    // Apply rotation
    this.carRotation += yawRate * dt;
    this.playerCar.root.rotation.y = this.carRotation;

    // Move forward in heading direction
    const forwardX = Math.sin(this.carRotation);
    const forwardZ = Math.cos(this.carRotation);

    this.carPosition.x += forwardX * this.carSpeed * dt;
    this.carPosition.z += forwardZ * this.carSpeed * dt;

    // Calculate ground height at current position
    const currentGroundY = this.getGroundHeight(this.carPosition.x, this.carPosition.z);

    // Apply vertical jump and gravity
    if (!this.isGrounded) {
      this.verticalVelocity -= 26.0 * dt; // Realistic gravity
      this.carPosition.y += this.verticalVelocity * dt;
      this.airTime += dt;
    }

    // Ground clamping & Landing detection (NEVER fall through the ground!)
    if (this.carPosition.y <= currentGroundY) {
      const impactVel = this.verticalVelocity;
      this.carPosition.y = currentGroundY;
      this.verticalVelocity = 0;

      if (!this.isGrounded) {
        this.isGrounded = true;
        // High impact landing sound & sparks
        if (impactVel < -5.0) {
          soundEngine.playCrash(Math.min(1.0, Math.abs(impactVel) / 14));
          this.spawnSparks(this.carPosition);
          if (this.airTime > 0.6) {
            this.recordAirTimeBonus(this.airTime);
          }
        }
        this.airTime = 0;
      }
    } else if (this.isGrounded && this.carPosition.y > currentGroundY + 0.35) {
      // Drove off a ramp or elevated highway ledge!
      this.isGrounded = false;
      if (this.carSpeed > 6) {
        this.verticalVelocity = Math.max(3.5, this.carSpeed * 0.3);
      }
    }

    // Collision Detection against city buildings & obstacles
    this.checkCollisions();

    // Absolute ground safety guarantee
    this.carPosition.y = Math.max(currentGroundY, this.carPosition.y);
    this.playerCar.root.position.copy(this.carPosition);

    // Wheels rotation animation
    const wheelCircumference = 2 * Math.PI * 0.34;
    const wheelRotDelta = (this.carSpeed * dt) / wheelCircumference;
    this.playerCar.wheels.forEach((w) => (w.rotation.x += wheelRotDelta));
    this.playerCar.rims.forEach((r) => (r.rotation.x += wheelRotDelta));

    // Suspension Body Roll & Pitch Animation
    const lateralAcc = this.carSpeed * yawRate;
    const rollAngle = THREE.MathUtils.clamp(-lateralAcc * 0.015, -0.15, 0.15);
    const pitchAngle = THREE.MathUtils.clamp(-throttle * 0.04, -0.08, 0.08);

    this.playerCar.bodyGroup.rotation.z += (rollAngle - this.playerCar.bodyGroup.rotation.z) * dt * 8;
    this.playerCar.bodyGroup.rotation.x += (pitchAngle - this.playerCar.bodyGroup.rotation.x) * dt * 8;

    // Simulated 6-speed Transmission & Engine RPM
    this.updateGearsAndAudio(speedKmh, throttle, isEV);

    // Checkpoints & Laps
    this.checkCircuitProgress();
  }

  private updateGearsAndAudio(speedKmh: number, throttle: number, isEV: boolean) {
    if (isEV) {
      this.currentGear = 1;
      this.engineRpm = Math.min(1.0, speedKmh / 370);
    } else {
      const gearRanges = [0, 50, 95, 145, 205, 270, 380];
      let gear = 1;
      for (let g = 1; g < gearRanges.length; g++) {
        if (speedKmh > gearRanges[g - 1]) gear = g;
      }
      this.currentGear = gear;

      const minGearSpeed = gearRanges[gear - 1];
      const maxGearSpeed = gearRanges[gear] || 400;
      const progressInGear = (speedKmh - minGearSpeed) / (maxGearSpeed - minGearSpeed);
      this.engineRpm = 0.2 + progressInGear * 0.8;
    }

    soundEngine.updateEngineSound(
      this.engineRpm,
      throttle,
      this.playerCar.carDef.engineSoundPitch,
      isEV
    );
  }

  private checkCollisions() {
    const carBox = new THREE.Box3(
      new THREE.Vector3(this.carPosition.x - 1.0, 0.1, this.carPosition.z - 2.2),
      new THREE.Vector3(this.carPosition.x + 1.0, 1.8, this.carPosition.z + 2.2)
    );

    // 1. World collision boxes (buildings, barriers, pillars)
    for (const b of this.world.collisionBoxes) {
      if (carBox.intersectsBox(b)) {
        this.handleCrashBounce(b);
        break;
      }
    }

    // 2. Traffic car collisions & Near Miss detection
    this.trafficCars.forEach((tc) => {
      const dist = this.carPosition.distanceTo(tc.pos);
      if (dist < 2.8) {
        // Crash
        soundEngine.playCrash(1.2);
        this.carSpeed *= -0.3;
        this.spawnSparks(this.carPosition);
      } else if (dist < 5.0 && Math.abs(this.carSpeed) > 18) {
        // Near Miss!
        this.recordNearMiss();
      }
    });

    // 3. AI Opponents collisions
    this.aiCars.forEach((ai) => {
      const dist = this.carPosition.distanceTo(ai.pos);
      if (dist < 3.0) {
        soundEngine.playCrash(0.8);
        this.carSpeed *= 0.6;
        ai.speed *= 0.7;
        this.spawnSparks(this.carPosition);
      }
    });
  }

  private handleCrashBounce(box: THREE.Box3) {
    soundEngine.playCrash(Math.min(1.5, Math.abs(this.carSpeed) / 15));
    this.carSpeed *= -0.45;

    // Push away slightly
    const center = new THREE.Vector3();
    box.getCenter(center);
    const pushDir = this.carPosition.clone().sub(center).normalize();
    this.carPosition.add(pushDir.multiplyScalar(0.4));

    this.spawnSparks(this.carPosition);
  }

  private recordNearMiss() {
    const now = performance.now();
    if (now - this.nearMissNoticeTimer > 1500) {
      this.nearMissNoticeTimer = now;
      this.nearMissCount++;
      const bonus = 150 * (1 + Math.floor(this.nearMissCount / 3));
      this.trafficScore += bonus;
      this.lastNearMissNotice = `NEAR MISS! +$${bonus}`;
    }
  }

  private spawnTireSmoke() {
    [-0.9, 0.9].forEach((side) => {
      const smoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
      const offset = new THREE.Vector3(side, 0.2, -1.3).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.carRotation
      );
      smoke.position.copy(this.carPosition).add(offset);
      this.scene.add(smoke);

      this.smokeParticles.push({
        mesh: smoke,
        life: 0,
        maxLife: 0.6,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2 + Math.random(), (Math.random() - 0.5) * 1.5),
      });
    });
  }

  private spawnSparks(pos: THREE.Vector3) {
    const sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let i = 0; i < 14; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(pos);
      this.scene.add(spark);

      this.sparkParticles.push({
        mesh: spark,
        life: 0,
        vel: new THREE.Vector3((Math.random() - 0.5) * 14, 3 + Math.random() * 8, (Math.random() - 0.5) * 14),
      });
    }
  }

  private updateParticles(dt: number) {
    // Smoke
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const scale = 1.0 + (p.life / p.maxLife) * 2.5;
      p.mesh.scale.set(scale, scale, scale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 * (1 - p.life / p.maxLife));

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.smokeParticles.splice(i, 1);
      }
    }

    // Sparks
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const s = this.sparkParticles[i];
      s.life += dt;
      s.vel.y -= 18 * dt; // gravity
      s.mesh.position.addScaledVector(s.vel, dt);

      if (s.life >= 0.45) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        this.sparkParticles.splice(i, 1);
      }
    }
  }

  private updateTurnSignals(dt: number) {
    this.turnSignalTimer += dt;
    const isBlinkOn = Math.floor(this.turnSignalTimer * 3.5) % 2 === 0;

    const setSignals = (signals: THREE.Mesh[], on: boolean) => {
      signals.forEach((s) => {
        const mat = s.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = on ? 2.5 : 0.05;
      });
    };

    setSignals(this.playerCar.leftTurnSignals, (this.turnSignalState === 'LEFT' || this.turnSignalState === 'HAZARD') && isBlinkOn);
    setSignals(this.playerCar.rightTurnSignals, (this.turnSignalState === 'RIGHT' || this.turnSignalState === 'HAZARD') && isBlinkOn);
  }

  private checkCircuitProgress() {
    if (this.mode !== 'RACE' && this.mode !== 'TIME_TRIAL') return;

    const checkpoints = this.world.circuitCheckpoints;
    const cp = checkpoints[this.currentCheckpointIndex];
    const dist = Math.hypot(this.carPosition.x - cp.x, this.carPosition.z - cp.z);

    if (dist < cp.radius + 6) {
      this.currentCheckpointIndex++;
      if (this.mode === 'TIME_TRIAL') {
        this.timeTrialTimer += 6.5; // gate bonus
      }

      if (this.currentCheckpointIndex >= checkpoints.length) {
        this.currentCheckpointIndex = 0;
        this.currentLap++;

        if (this.currentLap > this.totalLaps) {
          this.finishRace(true);
        }
      }
    }
  }

  private finishRace(wonByCompletion: boolean) {
    if (this.finishResults) return;
    this.raceStatus = 'FINISHED';

    const playerPosRanking = this.calculatePosition();
    let earnings = 0;

    if (this.mode === 'RACE') {
      if (playerPosRanking === 1) earnings = 7500;
      else if (playerPosRanking === 2) earnings = 4000;
      else earnings = 2000;
    } else if (this.mode === 'TIME_TRIAL') {
      earnings = wonByCompletion ? 5000 : 800;
    } else if (this.mode === 'DRIFT') {
      earnings = Math.floor(this.driftScore * 0.25);
    } else if (this.mode === 'TRAFFIC_RUN') {
      earnings = this.trafficScore;
    }

    this.finishResults = {
      won: wonByCompletion && playerPosRanking === 1,
      position: playerPosRanking,
      time: this.raceTime,
      earnings,
      driftScore: this.driftScore,
    };

    // Update profile
    this.profile.money += earnings;
    this.profile.xp += earnings / 2;
    this.profile.level = Math.floor(this.profile.xp / 4000) + 1;
    if (this.mode === 'DRIFT' && this.driftScore > this.profile.highScores.driftScore) {
      this.profile.highScores.driftScore = this.driftScore;
    }
    if (this.mode === 'TRAFFIC_RUN' && this.trafficScore > this.profile.highScores.trafficRunScore) {
      this.profile.highScores.trafficRunScore = this.trafficScore;
    }
    if (playerPosRanking === 1) {
      this.profile.highScores.racesWon++;
      soundEngine.playVictoryFanfare();
    }

    if (this.onSaveProfile) {
      this.onSaveProfile(this.profile);
    }
  }

  private updateAIOpponents(dt: number) {
    if (this.mode !== 'RACE' || this.raceStatus !== 'RACING') return;

    const checkpoints = this.world.circuitCheckpoints;

    this.aiCars.forEach((ai) => {
      const targetCp = checkpoints[ai.checkpointIndex];
      const dx = targetCp.x - ai.pos.x;
      const dz = targetCp.z - ai.pos.z;
      const dist = Math.hypot(dx, dz);

      // Desired angle
      const desiredAngle = Math.atan2(dx, dz);
      let angleDiff = desiredAngle - ai.rot;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // AI Steer & Speed
      ai.rot += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), dt * 2.8);
      const isSharpTurn = Math.abs(angleDiff) > 0.45;
      const targetSpeed = isSharpTurn ? ai.targetSpeed * 0.55 : ai.targetSpeed;

      if (ai.speed < targetSpeed) ai.speed += dt * 14;
      else ai.speed -= dt * 18;

      ai.pos.x += Math.sin(ai.rot) * ai.speed * dt;
      ai.pos.z += Math.cos(ai.rot) * ai.speed * dt;

      ai.builtCar.root.position.copy(ai.pos);
      ai.builtCar.root.rotation.y = ai.rot;

      // Advance checkpoint
      if (dist < targetCp.radius + 8) {
        ai.checkpointIndex = (ai.checkpointIndex + 1) % checkpoints.length;
        if (ai.checkpointIndex === 0) {
          ai.lap++;
          if (ai.lap > this.totalLaps) {
            ai.finished = true;
          }
        }
      }
    });
  }

  private updateTraffic(dt: number) {
    if (this.mode !== 'TRAFFIC_RUN' && this.mode !== 'FREE_DRIVE') return;

    this.trafficCars.forEach((tc) => {
      tc.pos.z += tc.direction * tc.speed * dt;

      // Wrap around road bounds
      if (tc.direction > 0 && tc.pos.z > 240) {
        tc.pos.z = -240;
      } else if (tc.direction < 0 && tc.pos.z < -240) {
        tc.pos.z = 240;
      }

      tc.group.position.copy(tc.pos);
    });
  }

  private updateWorld(time: number) {
    this.world.updateTrafficLights(time);
    this.world.updateRain(this.carPosition);
  }

  private updateCamera(dt: number) {
    const forwardX = Math.sin(this.carRotation);
    const forwardZ = Math.cos(this.carRotation);
    const speedRatio = Math.min(1.0, Math.abs(this.carSpeed) / 75);

    // Dynamic FOV punch during high speed & nitro
    const targetFov = 65 + speedRatio * 18 + (this.isNitroActive ? 12 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * dt * 5;
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'CHASE') {
      const followDist = 7.5 + speedRatio * 2.0;
      const followHeight = 2.8 + speedRatio * 0.4;
      const targetCamPos = new THREE.Vector3(
        this.carPosition.x - forwardX * followDist,
        this.carPosition.y + followHeight,
        this.carPosition.z - forwardZ * followDist
      );

      this.camera.position.lerp(targetCamPos, dt * 7.5);
      const lookTarget = this.carPosition.clone().add(new THREE.Vector3(0, 1.2, 0));
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'CLOSE') {
      const followDist = 5.2;
      const followHeight = 2.0;
      const targetCamPos = new THREE.Vector3(
        this.carPosition.x - forwardX * followDist,
        this.carPosition.y + followHeight,
        this.carPosition.z - forwardZ * followDist
      );
      this.camera.position.lerp(targetCamPos, dt * 10);
      const lookTarget = this.carPosition.clone().add(new THREE.Vector3(0, 1.0, 0));
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'HOOD') {
      const hoodOffset = new THREE.Vector3(0, 0.85, 0.6).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.carRotation
      );
      this.camera.position.copy(this.carPosition).add(hoodOffset);
      const lookAhead = this.carPosition.clone().add(
        new THREE.Vector3(forwardX * 25, 0.6, forwardZ * 25)
      );
      this.camera.lookAt(lookAhead);
    } else if (this.cameraMode === 'COCKPIT') {
      const seatOffset = new THREE.Vector3(-0.35, 1.02, -0.1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.carRotation
      );
      this.camera.position.copy(this.carPosition).add(seatOffset);
      const lookAhead = this.carPosition.clone().add(
        new THREE.Vector3(forwardX * 30, 0.8, forwardZ * 30)
      );
      this.camera.lookAt(lookAhead);
    }
  }

  private calculatePosition(): number {
    if (this.mode !== 'RACE') return 1;

    let aheadCount = 0;
    const playerProgress = this.currentLap * 100 + this.currentCheckpointIndex;

    this.aiCars.forEach((ai) => {
      const aiProgress = ai.lap * 100 + ai.checkpointIndex;
      if (aiProgress > playerProgress) aheadCount++;
    });

    return aheadCount + 1;
  }

  private updateTelemetry(dt: number) {
    if (!this.onTelemetryUpdate) return;

    if (this.lastNearMissNotice) {
      const elapsed = performance.now() - this.nearMissNoticeTimer;
      if (elapsed > 2000) {
        this.lastNearMissNotice = null;
      }
    }

    this.onTelemetryUpdate({
      speedKmh: Math.floor(Math.abs(this.carSpeed) * 3.6),
      rpm: this.engineRpm,
      gear: this.currentGear,
      nitro: this.nitroTank,
      driftScore: this.driftScore,
      driftMultiplier: this.driftMultiplier,
      isDrifting: this.isDrifting,
      racePosition: this.calculatePosition(),
      currentLap: Math.min(this.currentLap, this.totalLaps),
      totalLaps: this.totalLaps,
      raceTime: this.raceTime,
      countdown: this.countdownTimer > 0 ? Math.ceil(this.countdownTimer) : null,
      timeTrialRemaining: Math.max(0, Math.ceil(this.timeTrialTimer)),
      trafficScore: this.trafficScore,
      nearMissCount: this.nearMissCount,
      lastNearMissNotice: this.lastNearMissNotice,
      modeFinished: this.finishResults !== null,
      finishResults: this.finishResults,
    });
  }

  private renderMinimap() {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark semi-transparent background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // Coordinate conversion from 3D world [-250, 250] to minimap canvas [0, w]
    const mapScale = w / 500;
    const worldToMap = (wx: number, wz: number) => ({
      x: w / 2 + wx * mapScale,
      y: h / 2 + wz * mapScale,
    });

    // 1. Draw Roads
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14 * mapScale;
    ctx.beginPath();
    // North-South main avenue
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    // East-West cross avenues
    const pz1 = worldToMap(0, 120).y;
    const pz2 = worldToMap(0, -120).y;
    ctx.moveTo(0, pz1);
    ctx.lineTo(w, pz1);
    ctx.moveTo(0, pz2);
    ctx.lineTo(w, pz2);
    ctx.stroke();

    // 2. Draw Circuit Checkpoints
    if (this.mode === 'RACE' || this.mode === 'TIME_TRIAL') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.world.circuitCheckpoints.forEach((cp, idx) => {
        const mp = worldToMap(cp.x, cp.z);
        if (idx === 0) ctx.moveTo(mp.x, mp.y);
        else ctx.lineTo(mp.x, mp.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Current target checkpoint
      const currentCp = this.world.circuitCheckpoints[this.currentCheckpointIndex];
      if (currentCp) {
        const cmp = worldToMap(currentCp.x, currentCp.z);
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(cmp.x, cmp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw AI Opponents
    ctx.fillStyle = '#ef4444';
    this.aiCars.forEach((ai) => {
      const amp = worldToMap(ai.pos.x, ai.pos.z);
      ctx.beginPath();
      ctx.arc(amp.x, amp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Traffic
    ctx.fillStyle = '#eab308';
    this.trafficCars.forEach((tc) => {
      const tmp = worldToMap(tc.pos.x, tc.pos.z);
      ctx.beginPath();
      ctx.arc(tmp.x, tmp.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Draw Player Car Arrow
    const pmp = worldToMap(this.carPosition.x, this.carPosition.z);
    ctx.save();
    ctx.translate(pmp.x, pmp.y);
    ctx.rotate(-this.carRotation + Math.PI);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      soundEngine.stopEngine();
    } else {
      soundEngine.startEngine(this.playerCar.carDef.engineSoundPitch);
    }
  }

  public setWeatherAndTime(weather: WeatherType, timeOfDay: TimeOfDay) {
    this.settings.weather = weather;
    this.settings.timeOfDay = timeOfDay;
    this.world.updateWeather(weather, timeOfDay);
    this.applyTimeOfDayLighting(timeOfDay);
  }

  public setGraphicsQuality(quality: 'LOW' | 'MEDIUM' | 'HIGH') {
    this.settings.quality = quality;
    this.renderer.shadowMap.enabled = quality === 'HIGH';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'HIGH' ? 2 : 1.25));
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundEngine.stopEngine();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
