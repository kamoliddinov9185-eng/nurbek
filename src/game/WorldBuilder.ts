import * as THREE from 'three';
import { TimeOfDay, WeatherType, RaceCheckpoint } from '../types/game';

export interface WorldBuildResult {
  scene: THREE.Scene;
  roadMeshes: THREE.Mesh[];
  collisionBoxes: THREE.Box3[];
  streetLights: THREE.PointLight[];
  trafficLightMeshes: THREE.Mesh[];
  buildingWindowMaterials: THREE.MeshBasicMaterial[];
  rainParticles: THREE.Points | null;
  circuitCheckpoints: RaceCheckpoint[];
  updateWeather: (weather: WeatherType, timeOfDay: TimeOfDay) => void;
  updateTrafficLights: (time: number) => void;
  updateRain: (playerPos: THREE.Vector3) => void;
}

export class WorldBuilder {
  public static buildWorld(scene: THREE.Scene): WorldBuildResult {
    const roadMeshes: THREE.Mesh[] = [];
    const collisionBoxes: THREE.Box3[] = [];
    const streetLights: THREE.PointLight[] = [];
    const trafficLightMeshes: THREE.Mesh[] = [];
    const buildingWindowMaterials: THREE.MeshBasicMaterial[] = [];

    // 1. Terrain Base
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Distant Mountains Backdrop
    this.createDistantMountains(scene);

    // 3. Road System: City Grid + Highway + Bridge + Tunnel
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.75,
      metalness: 0.15,
    });
    const wetAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x161a20,
      roughness: 0.25,
      metalness: 0.4,
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.7,
    });

    // Main city avenue (North-South, 4 lanes)
    this.createRoadSegment(
      scene,
      roadMeshes,
      asphaltMat,
      sidewalkMat,
      curbMat,
      0,
      0,
      24,
      500,
      0,
      true,
      collisionBoxes
    );

    // Cross Avenue 1 (East-West at z = 120)
    this.createRoadSegment(
      scene,
      roadMeshes,
      asphaltMat,
      sidewalkMat,
      curbMat,
      0,
      120,
      20,
      400,
      Math.PI / 2,
      false,
      collisionBoxes
    );

    // Cross Avenue 2 (East-West at z = -120)
    this.createRoadSegment(
      scene,
      roadMeshes,
      asphaltMat,
      sidewalkMat,
      curbMat,
      0,
      -120,
      20,
      400,
      Math.PI / 2,
      false,
      collisionBoxes
    );

    // Outer East Ring Road (connects cross avenues)
    this.createRoadSegment(
      scene,
      roadMeshes,
      asphaltMat,
      sidewalkMat,
      curbMat,
      200,
      0,
      18,
      300,
      0,
      false,
      collisionBoxes
    );

    // Outer West Ring Road (connects cross avenues)
    this.createRoadSegment(
      scene,
      roadMeshes,
      asphaltMat,
      sidewalkMat,
      curbMat,
      -200,
      0,
      18,
      300,
      0,
      false,
      collisionBoxes
    );

    // High-Speed Highway Overpass (Elevated section)
    this.createElevatedHighway(scene, roadMeshes, asphaltMat, collisionBoxes);

    // Bridge with water canal
    this.createWaterCanalAndBridge(scene, roadMeshes, asphaltMat, collisionBoxes);

    // Mountain Tunnel section
    this.createTunnelSection(scene, roadMeshes, asphaltMat, collisionBoxes);

    // Gas Station & Garage Lot
    this.createGasStation(scene, collisionBoxes);

    // Stunt Jump Ramps
    this.createStuntRamps(scene, roadMeshes);

    // Buildings & Skyscrapers
    this.createCityBuildings(scene, collisionBoxes, buildingWindowMaterials);

    // Street Furniture & Props (Traffic lights, street lamps, trees, billboards)
    this.createStreetProps(scene, streetLights, trafficLightMeshes, collisionBoxes);

    // Rain Particle System
    const rainParticles = this.createRainSystem(scene);

    // Race Circuit Checkpoints (Closed loop track for Circuit & Time Trial)
    const circuitCheckpoints: RaceCheckpoint[] = [
      { x: 0, z: -200, radius: 14, angle: 0 },
      { x: 0, z: -120, radius: 14, angle: 0 },
      { x: 80, z: -120, radius: 14, angle: Math.PI / 2 },
      { x: 180, z: -80, radius: 14, angle: Math.PI / 4 },
      { x: 200, z: 40, radius: 14, angle: 0 },
      { x: 140, z: 120, radius: 14, angle: -Math.PI / 3 },
      { x: 0, z: 120, radius: 14, angle: -Math.PI / 2 },
      { x: -120, z: 120, radius: 14, angle: -Math.PI / 2 },
      { x: -200, z: 20, radius: 14, angle: -Math.PI / 4 },
      { x: -160, z: -100, radius: 14, angle: Math.PI / 4 },
      { x: -60, z: -120, radius: 14, angle: 0 },
      { x: 0, z: -170, radius: 14, angle: 0 },
    ];

    // Weather & Atmosphere updater
    const updateWeather = (weather: WeatherType, timeOfDay: TimeOfDay) => {
      // 1. Atmosphere & Fog
      if (weather === 'FOG') {
        scene.fog = new THREE.FogExp2(timeOfDay === 'NIGHT' ? 0x090d16 : 0x94a3b8, 0.015);
      } else if (weather === 'RAIN') {
        scene.fog = new THREE.FogExp2(timeOfDay === 'NIGHT' ? 0x05070a : 0x475569, 0.007);
      } else {
        scene.fog = new THREE.Fog(timeOfDay === 'NIGHT' ? 0x030712 : 0x1e293b, 80, 550);
      }

      // 2. Asphalt wetness
      roadMeshes.forEach((rm) => {
        rm.material = weather === 'RAIN' ? wetAsphaltMat : asphaltMat;
      });

      // 3. Rain particle visibility
      if (rainParticles) {
        rainParticles.visible = weather === 'RAIN';
      }

      // 4. Street lights and building window glow for Night vs Day
      const isDark = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';
      streetLights.forEach((light) => {
        light.intensity = isDark ? 3.5 : 0;
      });
      buildingWindowMaterials.forEach((mat) => {
        mat.color.set(isDark ? 0xfff3b0 : 0x334155);
      });
    };

    // Traffic light sequencer (green -> yellow -> red)
    const updateTrafficLights = (time: number) => {
      const cycle = Math.floor(time * 0.4) % 3; // 0 = green, 1 = yellow, 2 = red
      trafficLightMeshes.forEach((mesh, index) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const phase = (cycle + (index % 2)) % 3;
        if (phase === 0) {
          mat.color.set(0x22c55e);
          mat.emissive.set(0x22c55e);
        } else if (phase === 1) {
          mat.color.set(0xeab308);
          mat.emissive.set(0xeab308);
        } else {
          mat.color.set(0xef4444);
          mat.emissive.set(0xef4444);
        }
      });
    };

    // Rain position tracking to stay above player
    const updateRain = (playerPos: THREE.Vector3) => {
      if (!rainParticles || !rainParticles.visible) return;
      rainParticles.position.x = playerPos.x;
      rainParticles.position.z = playerPos.z;

      const positions = rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 1.8;
        if (positions[i] < 0) {
          positions[i] = 45;
        }
      }
      rainParticles.geometry.attributes.position.needsUpdate = true;
    };

    return {
      scene,
      roadMeshes,
      collisionBoxes,
      streetLights,
      trafficLightMeshes,
      buildingWindowMaterials,
      rainParticles,
      circuitCheckpoints,
      updateWeather,
      updateTrafficLights,
      updateRain,
    };
  }

  private static createRoadSegment(
    scene: THREE.Scene,
    roadMeshes: THREE.Mesh[],
    asphaltMat: THREE.Material,
    sidewalkMat: THREE.Material,
    curbMat: THREE.Material,
    x: number,
    z: number,
    width: number,
    length: number,
    rotationY: number,
    isMainAvenue: boolean,
    collisionBoxes: THREE.Box3[]
  ) {
    const roadGroup = new THREE.Group();
    roadGroup.position.set(x, 0.02, z);
    roadGroup.rotation.y = rotationY;

    // Asphalt surface
    const roadGeo = new THREE.PlaneGeometry(width, length);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);
    roadMeshes.push(roadMesh);

    // Lane Markings (Dashed white stripes & solid yellow center lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Double yellow center divider
    [-0.15, 0.15].forEach((off) => {
      const yLineGeo = new THREE.PlaneGeometry(0.18, length);
      const yLine = new THREE.Mesh(yLineGeo, yellowMat);
      yLine.rotation.x = -Math.PI / 2;
      yLine.position.set(off, 0.03, 0);
      roadGroup.add(yLine);
    });

    // Dashed white lane dividers
    const lanes = isMainAvenue ? [-6, 6] : [-4.5, 4.5];
    lanes.forEach((lx) => {
      const dashCount = Math.floor(length / 8);
      for (let i = 0; i < dashCount; i++) {
        const dashGeo = new THREE.PlaneGeometry(0.15, 4);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.03, -length / 2 + i * 8 + 4);
        roadGroup.add(dash);
      }
    });

    // Sidewalks & Curbs
    const sidewalkWidth = 3.5;
    [-1, 1].forEach((dir) => {
      const swGeo = new THREE.BoxGeometry(sidewalkWidth, 0.25, length);
      const sw = new THREE.Mesh(swGeo, sidewalkMat);
      sw.position.set(dir * (width / 2 + sidewalkWidth / 2), 0.125, 0);
      sw.receiveShadow = true;
      roadGroup.add(sw);

      // Curb highlight
      const curbGeo = new THREE.BoxGeometry(0.3, 0.28, length);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(dir * (width / 2 + 0.15), 0.14, 0);
      roadGroup.add(curb);
    });

    scene.add(roadGroup);
  }

  private static createElevatedHighway(
    scene: THREE.Scene,
    roadMeshes: THREE.Mesh[],
    asphaltMat: THREE.Material,
    collisionBoxes: THREE.Box3[]
  ) {
    const hwGroup = new THREE.Group();
    hwGroup.position.set(-80, 8.0, 0);

    const hwLength = 360;
    const hwWidth = 18;

    // Road surface
    const hwGeo = new THREE.BoxGeometry(hwWidth, 0.6, hwLength);
    const hwMesh = new THREE.Mesh(hwGeo, asphaltMat);
    hwMesh.position.set(0, 0, 0);
    hwMesh.receiveShadow = true;
    hwGroup.add(hwMesh);
    roadMeshes.push(hwMesh);

    // Highway Concrete Barriers
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    [-1, 1].forEach((side) => {
      const bGeo = new THREE.BoxGeometry(0.5, 1.2, hwLength);
      const bMesh = new THREE.Mesh(bGeo, barrierMat);
      bMesh.position.set(side * (hwWidth / 2 - 0.25), 0.8, 0);
      hwGroup.add(bMesh);

      // Register collision box for barriers
      const bWorldPos = new THREE.Vector3(-80 + side * (hwWidth / 2 - 0.25), 8.8, 0);
      collisionBoxes.push(
        new THREE.Box3(
          new THREE.Vector3(bWorldPos.x - 0.3, 7.5, -hwLength / 2),
          new THREE.Vector3(bWorldPos.x + 0.3, 10.0, hwLength / 2)
        )
      );
    });

    // Highway support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    for (let z = -hwLength / 2 + 30; z < hwLength / 2; z += 40) {
      const pGeo = new THREE.CylinderGeometry(1.2, 1.2, 8.0, 16);
      const pMesh = new THREE.Mesh(pGeo, pillarMat);
      pMesh.position.set(0, -4.0, z);
      hwGroup.add(pMesh);
    }

    // Access Ramps (South and North)
    const rampLength = 70;
    const rampAngle = Math.atan2(8.0, rampLength);
    [-1, 1].forEach((dir) => {
      const rampGeo = new THREE.BoxGeometry(hwWidth, 0.5, rampLength);
      const ramp = new THREE.Mesh(rampGeo, asphaltMat);
      ramp.position.set(0, -4.0, dir * (hwLength / 2 + rampLength / 2));
      ramp.rotation.x = dir * rampAngle;
      hwGroup.add(ramp);
      roadMeshes.push(ramp);
    });

    scene.add(hwGroup);
  }

  private static createWaterCanalAndBridge(
    scene: THREE.Scene,
    roadMeshes: THREE.Mesh[],
    asphaltMat: THREE.Material,
    collisionBoxes: THREE.Box3[]
  ) {
    // Canal Water Surface
    const waterGeo = new THREE.PlaneGeometry(120, 500);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(130, -0.2, 0);
    scene.add(water);

    // Bridge Arches & Railings for Cross Avenues
    [120, -120].forEach((bz) => {
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(130, 0.05, bz);

      // Arch cables & steel trusses
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
      [-1, 1].forEach((side) => {
        const archGeo = new THREE.TorusGeometry(35, 0.6, 8, 24, Math.PI);
        const arch = new THREE.Mesh(archGeo, steelMat);
        arch.position.set(0, 0, side * 10);
        arch.rotation.y = 0;
        bridgeGroup.add(arch);

        // Vertical suspension cables
        for (let x = -30; x <= 30; x += 6) {
          const cableGeo = new THREE.CylinderGeometry(0.08, 0.08, 25, 6);
          const cable = new THREE.Mesh(cableGeo, steelMat);
          cable.position.set(x, 10, side * 10);
          bridgeGroup.add(cable);
        }
      });
      scene.add(bridgeGroup);
    });
  }

  private static createTunnelSection(
    scene: THREE.Scene,
    roadMeshes: THREE.Mesh[],
    asphaltMat: THREE.Material,
    collisionBoxes: THREE.Box3[]
  ) {
    const tunnelGroup = new THREE.Group();
    tunnelGroup.position.set(-200, 0, 0);

    const tunnelLen = 120;
    const tunnelGeo = new THREE.CylinderGeometry(14, 14, tunnelLen, 24, 1, true, Math.PI, Math.PI);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      side: THREE.BackSide,
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.rotation.z = Math.PI / 2;
    tunnel.position.set(0, 7, 0);
    tunnelGroup.add(tunnel);

    // Overhead Yellow Tunnel Lights
    for (let z = -tunnelLen / 2 + 10; z < tunnelLen / 2; z += 20) {
      const tLightGeo = new THREE.BoxGeometry(0.8, 0.2, 3);
      const tLightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const tLightMesh = new THREE.Mesh(tLightGeo, tLightMat);
      tLightMesh.position.set(0, 13.5, z);
      tunnelGroup.add(tLightMesh);

      const light = new THREE.PointLight(0xf59e0b, 1.8, 20);
      light.position.set(0, 12, z);
      tunnelGroup.add(light);
    }

    scene.add(tunnelGroup);
  }

  private static createGasStation(scene: THREE.Scene, collisionBoxes: THREE.Box3[]) {
    const gsGroup = new THREE.Group();
    gsGroup.position.set(40, 0, -40);

    // Canopy Roof
    const roofGeo = new THREE.BoxGeometry(22, 0.8, 16);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 5.5, 0);
    gsGroup.add(roof);

    // Canopy LED lights
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-6, 6].forEach((rx) => {
      const led = new THREE.Mesh(new THREE.PlaneGeometry(3, 10), ledMat);
      led.rotation.x = Math.PI / 2;
      led.position.set(rx, 5.05, 0);
      gsGroup.add(led);
    });

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    [
      [-8, -5],
      [-8, 5],
      [8, -5],
      [8, 5],
    ].forEach(([px, pz]) => {
      const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 5.5, 12);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 2.75, pz);
      gsGroup.add(pillar);

      collisionBoxes.push(
        new THREE.Box3(
          new THREE.Vector3(40 + px - 0.5, 0, -40 + pz - 0.5),
          new THREE.Vector3(40 + px + 0.5, 5, -40 + pz + 0.5)
        )
      );
    });

    // Fuel Pump islands
    [-4, 4].forEach((ix) => {
      const pumpIslandGeo = new THREE.BoxGeometry(2, 0.3, 8);
      const pumpIsland = new THREE.Mesh(pumpIslandGeo, pillarMat);
      pumpIsland.position.set(ix, 0.15, 0);
      gsGroup.add(pumpIsland);

      const pumpGeo = new THREE.BoxGeometry(1.0, 2.2, 1.2);
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.position.set(ix, 1.3, 0);
      gsGroup.add(pump);
    });

    // Convenience Store Building behind pumps
    const storeGeo = new THREE.BoxGeometry(24, 6.0, 14);
    const storeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const store = new THREE.Mesh(storeGeo, storeMat);
    store.position.set(0, 3.0, 18);
    gsGroup.add(store);

    collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(40 - 12, 0, -40 + 18 - 7),
        new THREE.Vector3(40 + 12, 6, -40 + 18 + 7)
      )
    );

    scene.add(gsGroup);
  }

  private static createCityBuildings(
    scene: THREE.Scene,
    collisionBoxes: THREE.Box3[],
    buildingWindowMaterials: THREE.MeshBasicMaterial[]
  ) {
    const buildingColors = [0x1e293b, 0x0f172a, 0x334155, 0x18181b, 0x27272a];
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
    buildingWindowMaterials.push(windowMat);

    // City blocks grid placements
    const blockPositions = [
      // Downtown West Block
      { x: -55, z: 50, countX: 3, countZ: 4, spacing: 28 },
      // Downtown East Block
      { x: 55, z: 50, countX: 3, countZ: 4, spacing: 28 },
      // North Business District
      { x: -55, z: -180, countX: 3, countZ: 3, spacing: 30 },
      { x: 55, z: -180, countX: 3, countZ: 3, spacing: 30 },
      // South Waterfront Blocks
      { x: 120, z: 220, countX: 2, countZ: 3, spacing: 32 },
    ];

    blockPositions.forEach((b) => {
      for (let ix = 0; ix < b.countX; ix++) {
        for (let iz = 0; iz < b.countZ; iz++) {
          const bx = b.x + ix * b.spacing;
          const bz = b.z + iz * b.spacing;

          // Variable height skyscrapers
          const height = 35 + Math.random() * 85;
          const width = 16 + Math.random() * 8;
          const depth = 16 + Math.random() * 8;

          const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          const bMat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.6,
            metalness: 0.3,
          });

          const bGeo = new THREE.BoxGeometry(width, height, depth);
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(bx, height / 2, bz);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          scene.add(bMesh);

          // Glowing windows patterns
          const winGeo = new THREE.PlaneGeometry(width * 0.9, height * 0.85);
          [-1, 1].forEach((dir) => {
            const winMesh = new THREE.Mesh(winGeo, windowMat);
            winMesh.position.set(bx, height * 0.5, bz + (dir * depth) / 2 + 0.05);
            if (dir < 0) winMesh.rotation.y = Math.PI;
            scene.add(winMesh);
          });

          // Register collision
          collisionBoxes.push(
            new THREE.Box3(
              new THREE.Vector3(bx - width / 2, 0, bz - depth / 2),
              new THREE.Vector3(bx + width / 2, height, bz + depth / 2)
            )
          );
        }
      }
    });
  }

  private static createStreetProps(
    scene: THREE.Scene,
    streetLights: THREE.PointLight[],
    trafficLightMeshes: THREE.Mesh[],
    collisionBoxes: THREE.Box3[]
  ) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Street Lights along Main Avenue
    for (let z = -220; z <= 220; z += 40) {
      [-14, 14].forEach((side) => {
        const poleGroup = new THREE.Group();
        poleGroup.position.set(side, 0, z);

        // Vertical pole
        const pGeo = new THREE.CylinderGeometry(0.18, 0.22, 8, 8);
        const pole = new THREE.Mesh(pGeo, poleMat);
        pole.position.y = 4;
        poleGroup.add(pole);

        // Curved arm extending over street
        const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 8);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.rotation.z = side > 0 ? Math.PI / 4 : -Math.PI / 4;
        arm.position.set(side > 0 ? -1.2 : 1.2, 7.8, 0);
        poleGroup.add(arm);

        // Lamp head bulb
        const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const bulb = new THREE.Mesh(bulbGeo, lampBulbMat);
        bulb.position.set(side > 0 ? -2.4 : 2.4, 7.4, 0);
        poleGroup.add(bulb);

        // Point Light
        const light = new THREE.PointLight(0xbae6fd, 3.5, 30);
        light.position.set(side > 0 ? -2.4 : 2.4, 7.0, 0);
        poleGroup.add(light);
        streetLights.push(light);

        scene.add(poleGroup);
      });
    }

    // Traffic Lights at Major Intersections (z = 120 and z = -120)
    [120, -120].forEach((iz) => {
      [-13, 13].forEach((ix) => {
        const tlGroup = new THREE.Group();
        tlGroup.position.set(ix, 0, iz);

        const poleGeo = new THREE.CylinderGeometry(0.15, 0.18, 6.5, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.25;
        tlGroup.add(pole);

        // Housing box
        const boxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(0, 5.5, 0);
        tlGroup.add(box);

        // Signal light mesh
        const signalGeo = new THREE.SphereGeometry(0.2, 12, 12);
        const signalMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x22c55e,
          emissiveIntensity: 1.5,
        });
        const signal = new THREE.Mesh(signalGeo, signalMat);
        signal.position.set(0, 5.5, 0.32);
        tlGroup.add(signal);
        trafficLightMeshes.push(signal);

        scene.add(tlGroup);
      });
    });

    // Trees along sidewalks
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    for (let z = -200; z <= 200; z += 50) {
      if (Math.abs(z - 120) < 25 || Math.abs(z - -120) < 25) continue;
      [-17, 17].forEach((tx) => {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, z);

        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.75;
        treeGroup.add(trunk);

        const folGeo = new THREE.SphereGeometry(2.2, 10, 10);
        const fol = new THREE.Mesh(folGeo, foliageMat);
        fol.position.y = 4.2;
        treeGroup.add(fol);

        scene.add(treeGroup);
      });
    }

    // Billboards with neon advertisements
    this.createBillboards(scene);
  }

  private static createBillboards(scene: THREE.Scene) {
    const bbGroup = new THREE.Group();
    bbGroup.position.set(15, 0, -100);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const pGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    const pole = new THREE.Mesh(pGeo, poleMat);
    pole.position.y = 6;
    bbGroup.add(pole);

    const boardGeo = new THREE.BoxGeometry(16, 7, 0.6);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 11, 0);
    bbGroup.add(board);

    scene.add(bbGroup);
  }

  private static createDistantMountains(scene: THREE.Scene) {
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      metalness: 0.05,
    });

    const mGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 520 + Math.random() * 60;
      const mHeight = 120 + Math.random() * 90;
      const mRadius = 70 + Math.random() * 40;

      const mGeo = new THREE.ConeGeometry(mRadius, mHeight, 7);
      const mMesh = new THREE.Mesh(mGeo, mountainMat);
      mMesh.position.set(Math.cos(angle) * dist, mHeight / 2 - 20, Math.sin(angle) * dist);
      mGroup.add(mMesh);
    }
    scene.add(mGroup);
  }

  private static createRainSystem(scene: THREE.Scene): THREE.Points {
    const particleCount = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 140;
      positions[i + 1] = Math.random() * 45;
      positions[i + 2] = (Math.random() - 0.5) * 140;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa5b4fc,
      size: 0.28,
      transparent: true,
      opacity: 0.6,
    });

    const rain = new THREE.Points(geometry, material);
    rain.visible = false;
    scene.add(rain);
    return rain;
  }

  private static createStuntRamps(scene: THREE.Scene, roadMeshes: THREE.Mesh[]) {
    const rampPlacements = [
      { x: 0, z: -35, rotY: 0, width: 14, length: 18, height: 3.8 },
      { x: 200, z: -50, rotY: 0, width: 12, length: 16, height: 3.5 },
    ];

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.3,
    });
    const chevronMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    rampPlacements.forEach((r) => {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(r.x, 0, r.z);
      rampGroup.rotation.y = r.rotY;

      // Wedge geometry using BoxGeometry tilted
      const inclineAngle = Math.atan2(r.height, r.length);
      const hyp = Math.hypot(r.length, r.height);
      const inclineGeo = new THREE.BoxGeometry(r.width, 0.4, hyp);
      const incline = new THREE.Mesh(inclineGeo, rampMat);
      incline.position.set(0, r.height / 2, r.length / 2);
      incline.rotation.x = inclineAngle;
      incline.receiveShadow = true;
      rampGroup.add(incline);
      roadMeshes.push(incline);

      // Side guard rails
      [-r.width / 2 + 0.2, r.width / 2 - 0.2].forEach((sx) => {
        const railGeo = new THREE.BoxGeometry(0.3, 0.8, hyp);
        const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(sx, r.height / 2 + 0.4, r.length / 2);
        rail.rotation.x = inclineAngle;
        rampGroup.add(rail);
      });

      // Glowing chevron arrows on the ramp surface
      for (let c = 0; c < 3; c++) {
        const arrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(r.width * 0.7, 0.8), chevronMat);
        arrowMesh.rotation.x = -Math.PI / 2 + inclineAngle;
        arrowMesh.position.set(0, 0.25 + (c + 1) * (r.height / 4), (c + 1) * (r.length / 4));
        rampGroup.add(arrowMesh);
      }

      scene.add(rampGroup);
    });
  }
}

