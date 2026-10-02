import * as THREE from 'three';
import { CarDefinition, CarCustomization } from '../types/game';

export interface BuiltCar {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  frontLeftWheelPivot: THREE.Group;
  frontRightWheelPivot: THREE.Group;
  wheels: THREE.Mesh[];
  rims: THREE.Mesh[];
  headlightMeshes: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  brakeLights: THREE.Mesh[];
  leftTurnSignals: THREE.Mesh[];
  rightTurnSignals: THREE.Mesh[];
  underglowLight: THREE.PointLight | null;
  underglowMesh: THREE.Mesh | null;
  exhaustPositions: THREE.Vector3[];
  carDef: CarDefinition;
  customization: CarCustomization;
  updateMaterials: (c: CarCustomization) => void;
}

export class CarBuilder {
  public static buildCar(carDef: CarDefinition, customization: CarCustomization): BuiltCar {
    const root = new THREE.Group();
    root.name = `car_${carDef.id}`;

    // Body group for suspension roll/pitch tilt without rotating wheels
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Common materials
    const paintMaterial = this.createPaintMaterial(customization);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const blackTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.5,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const turnSignalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.1,
      roughness: 0.2,
    });

    const headlightMeshes: THREE.Mesh[] = [];
    const headlights: THREE.SpotLight[] = [];
    const brakeLights: THREE.Mesh[] = [];
    const leftTurnSignals: THREE.Mesh[] = [];
    const rightTurnSignals: THREE.Mesh[] = [];
    const wheels: THREE.Mesh[] = [];
    const rims: THREE.Mesh[] = [];
    const exhaustPositions: THREE.Vector3[] = [];

    // Distinct procedural silhouettes tailored to each car's inspired archetype
    this.createCarBody(
      carDef,
      bodyGroup,
      paintMaterial,
      glassMaterial,
      blackTrimMaterial,
      carbonMaterial,
      headlightMat,
      brakeLightMat,
      turnSignalMat,
      headlightMeshes,
      headlights,
      brakeLights,
      leftTurnSignals,
      rightTurnSignals,
      exhaustPositions
    );

    // Spoiler
    this.createSpoiler(customization.spoiler, bodyGroup, paintMaterial, carbonMaterial);

    // Wheels & Suspension Pivots
    const frontLeftWheelPivot = new THREE.Group();
    const frontRightWheelPivot = new THREE.Group();
    frontLeftWheelPivot.position.set(-0.92, 0.35, 1.45);
    frontRightWheelPivot.position.set(0.92, 0.35, 1.45);
    root.add(frontLeftWheelPivot);
    root.add(frontRightWheelPivot);

    const rearLeftPos = new THREE.Vector3(-0.92, 0.35, -1.35);
    const rearRightPos = new THREE.Vector3(0.92, 0.35, -1.35);

    // Build 4 wheels
    const rimMat = new THREE.MeshStandardMaterial({
      color: customization.wheelColor,
      metalness: 0.85,
      roughness: 0.25,
    });

    const flWheel = this.buildWheel(customization.wheelStyle, rimMat, chromeMaterial, true);
    frontLeftWheelPivot.add(flWheel.wheelGroup);
    wheels.push(flWheel.tireMesh);
    rims.push(flWheel.rimMesh);

    const frWheel = this.buildWheel(customization.wheelStyle, rimMat, chromeMaterial, false);
    frontRightWheelPivot.add(frWheel.wheelGroup);
    wheels.push(frWheel.tireMesh);
    rims.push(frWheel.rimMesh);

    const rlGroup = new THREE.Group();
    rlGroup.position.copy(rearLeftPos);
    root.add(rlGroup);
    const rlWheel = this.buildWheel(customization.wheelStyle, rimMat, chromeMaterial, true);
    rlGroup.add(rlWheel.wheelGroup);
    wheels.push(rlWheel.tireMesh);
    rims.push(rlWheel.rimMesh);

    const rrGroup = new THREE.Group();
    rrGroup.position.copy(rearRightPos);
    root.add(rrGroup);
    const rrWheel = this.buildWheel(customization.wheelStyle, rimMat, chromeMaterial, false);
    rrGroup.add(rrWheel.wheelGroup);
    wheels.push(rrWheel.tireMesh);
    rims.push(rrWheel.rimMesh);

    // Underglow Neon
    let underglowLight: THREE.PointLight | null = null;
    let underglowMesh: THREE.Mesh | null = null;
    if (customization.underglow && customization.underglow !== 'none') {
      const ugColor = new THREE.Color(customization.underglow);
      underglowLight = new THREE.PointLight(ugColor, 2.5, 3.5);
      underglowLight.position.set(0, 0.15, 0);
      root.add(underglowLight);

      const ugGeo = new THREE.PlaneGeometry(1.4, 2.8);
      const ugMat = new THREE.MeshBasicMaterial({
        color: ugColor,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      underglowMesh = new THREE.Mesh(ugGeo, ugMat);
      underglowMesh.rotation.x = -Math.PI / 2;
      underglowMesh.position.set(0, 0.08, 0);
      root.add(underglowMesh);
    }

    const updateMaterials = (c: CarCustomization) => {
      paintMaterial.color.set(c.paintColor);
      if (c.finish === 'matte') {
        paintMaterial.roughness = 0.85;
        paintMaterial.metalness = 0.1;
      } else if (c.finish === 'metallic') {
        paintMaterial.roughness = 0.2;
        paintMaterial.metalness = 0.8;
      } else {
        paintMaterial.roughness = 0.35;
        paintMaterial.metalness = 0.3;
      }
      rimMat.color.set(c.wheelColor);

      if (underglowLight && underglowMesh) {
        if (c.underglow && c.underglow !== 'none') {
          underglowLight.color.set(c.underglow);
          underglowLight.visible = true;
          (underglowMesh.material as THREE.MeshBasicMaterial).color.set(c.underglow);
          underglowMesh.visible = true;
        } else {
          underglowLight.visible = false;
          underglowMesh.visible = false;
        }
      }
    };

    return {
      root,
      bodyGroup,
      frontLeftWheelPivot,
      frontRightWheelPivot,
      wheels,
      rims,
      headlightMeshes,
      headlights,
      brakeLights,
      leftTurnSignals,
      rightTurnSignals,
      underglowLight,
      underglowMesh,
      exhaustPositions,
      carDef,
      customization,
      updateMaterials,
    };
  }

  private static createPaintMaterial(c: CarCustomization): THREE.MeshStandardMaterial {
    let roughness = 0.25;
    let metalness = 0.75;
    if (c.finish === 'matte') {
      roughness = 0.85;
      metalness = 0.1;
    } else if (c.finish === 'metallic') {
      roughness = 0.2;
      metalness = 0.85;
    }
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(c.paintColor),
      roughness,
      metalness,
    });
  }

  private static createCarBody(
    carDef: CarDefinition,
    group: THREE.Group,
    paint: THREE.Material,
    glass: THREE.Material,
    blackTrim: THREE.Material,
    carbon: THREE.Material,
    headlightMat: THREE.Material,
    brakeLightMat: THREE.Material,
    turnSignalMat: THREE.Material,
    headlightMeshes: THREE.Mesh[],
    headlights: THREE.SpotLight[],
    brakeLights: THREE.Mesh[],
    leftTurnSignals: THREE.Mesh[],
    rightTurnSignals: THREE.Mesh[],
    exhaustPositions: THREE.Vector3[]
  ) {
    const isWedgeSupercar = carDef.id === 'centauro-v12' || carDef.id === 'cyberion-ev';
    const isMuscle = carDef.id === 'stallion-v8' || carDef.id === 'daytona-ss';
    const isSedan = carDef.id === 'bavaria-m3' || carDef.id === 'stuttgart-amg';
    const isPorsche = carDef.id === 'carrera-911';
    const isSupra = carDef.id === 'supra-gt';
    const isGTR = carDef.id === 'yokohama-gtr';

    // 1. Lower Chassis / Floor
    const chassisGeo = new THREE.BoxGeometry(1.8, 0.2, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, blackTrim);
    chassis.position.set(0, 0.28, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // 2. Main Body Shell (Chiseled curves)
    let bodyWidth = 1.84;
    let bodyHeight = 0.52;
    let bodyLength = 4.3;

    if (isWedgeSupercar) {
      bodyWidth = 1.95;
      bodyHeight = 0.42;
      bodyLength = 4.5;
    } else if (isMuscle) {
      bodyWidth = 1.88;
      bodyHeight = 0.56;
      bodyLength = 4.6;
    } else if (isSedan) {
      bodyWidth = 1.82;
      bodyHeight = 0.54;
      bodyLength = 4.45;
    }

    const mainBodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const mainBody = new THREE.Mesh(mainBodyGeo, paint);
    mainBody.position.set(0, 0.55, 0.05);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // Front Hood & Nose
    const noseLength = isWedgeSupercar ? 1.6 : 1.4;
    const noseY = isWedgeSupercar ? 0.45 : 0.6;
    const noseGeo = new THREE.BoxGeometry(bodyWidth * 0.96, isWedgeSupercar ? 0.28 : 0.38, noseLength);
    const nose = new THREE.Mesh(noseGeo, paint);
    nose.position.set(0, noseY, 1.4);
    nose.castShadow = true;
    group.add(nose);

    // Front Splitter / Grille
    const splitterGeo = new THREE.BoxGeometry(bodyWidth * 0.98, 0.08, 0.6);
    const splitter = new THREE.Mesh(splitterGeo, carbon);
    splitter.position.set(0, 0.24, 2.1);
    splitter.castShadow = true;
    group.add(splitter);

    // Front Grille
    const grilleGeo = new THREE.BoxGeometry(bodyWidth * 0.7, 0.2, 0.1);
    const grille = new THREE.Mesh(grilleGeo, blackTrim);
    grille.position.set(0, 0.42, 2.12);
    group.add(grille);

    // Muscle Hood Scoop / Vents
    if (isMuscle) {
      const scoopGeo = new THREE.BoxGeometry(0.5, 0.1, 0.8);
      const scoop = new THREE.Mesh(scoopGeo, carbon);
      scoop.position.set(0, 0.83, 1.3);
      group.add(scoop);
    }

    // 3. Cabin & Greenhouse (Roof, pillars, glass)
    let cabinWidth = 1.46;
    let cabinHeight = 0.52;
    let cabinLength = 2.0;
    let cabinZ = -0.2;

    if (isWedgeSupercar) {
      cabinWidth = 1.35;
      cabinHeight = 0.42;
      cabinLength = 1.9;
      cabinZ = 0.0;
    } else if (isSedan) {
      cabinWidth = 1.5;
      cabinHeight = 0.58;
      cabinLength = 2.4;
      cabinZ = -0.15;
    } else if (isPorsche) {
      cabinWidth = 1.38;
      cabinHeight = 0.48;
      cabinLength = 1.9;
      cabinZ = -0.3;
    }

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, glass);
    cabin.position.set(0, 0.55 + bodyHeight * 0.5 + cabinHeight * 0.46, cabinZ);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof Panel
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.92, 0.06, cabinLength * 0.7);
    const roof = new THREE.Mesh(roofGeo, isWedgeSupercar ? carbon : paint);
    roof.position.set(0, cabin.position.y + cabinHeight * 0.5, cabinZ - 0.1);
    roof.castShadow = true;
    group.add(roof);

    // Windshield frame / pillars
    const windshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.95, 0.05, 0.85);
    const windshieldPillar = new THREE.Mesh(windshieldGeo, paint);
    windshieldPillar.position.set(0, cabin.position.y + 0.15, cabinZ + cabinLength * 0.45);
    windshieldPillar.rotation.x = -0.6;
    group.add(windshieldPillar);

    // Side Mirrors
    [-1, 1].forEach((dir) => {
      const mirrorArmGeo = new THREE.BoxGeometry(0.18, 0.04, 0.08);
      const mirrorArm = new THREE.Mesh(mirrorArmGeo, blackTrim);
      mirrorArm.position.set(dir * (bodyWidth * 0.5 + 0.08), 0.78, 0.65);
      group.add(mirrorArm);

      const mirrorHeadGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18);
      const mirrorHead = new THREE.Mesh(mirrorHeadGeo, paint);
      mirrorHead.position.set(dir * (bodyWidth * 0.5 + 0.18), 0.8, 0.65);
      group.add(mirrorHead);
    });

    // 4. Headlights (Working 3D mesh emitters & SpotLights)
    const hlWidth = isWedgeSupercar ? 0.4 : 0.28;
    const hlHeight = isWedgeSupercar ? 0.08 : 0.14;
    [-1, 1].forEach((dir) => {
      const hlGeo = new THREE.BoxGeometry(hlWidth, hlHeight, 0.15);
      const hlMesh = new THREE.Mesh(hlGeo, headlightMat);
      hlMesh.position.set(dir * 0.65, 0.55, 2.1);
      group.add(hlMesh);
      headlightMeshes.push(hlMesh);

      // Light beam
      const spot = new THREE.SpotLight(0xffffff, 4.0, 45, Math.PI / 6, 0.4, 1.2);
      spot.position.set(dir * 0.65, 0.65, 2.0);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(dir * 0.65, 0.1, 20.0);
      group.add(spotTarget);
      spot.target = spotTarget;
      group.add(spot);
      headlights.push(spot);

      // Front Turn Signals
      const tsGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
      const tsMesh = new THREE.Mesh(tsGeo, turnSignalMat);
      tsMesh.position.set(dir * (0.65 + hlWidth * 0.5 + 0.08), 0.55, 2.08);
      group.add(tsMesh);
      if (dir < 0) leftTurnSignals.push(tsMesh);
      else rightTurnSignals.push(tsMesh);
    });

    // 5. Taillights & Rear Diffuser
    [-1, 1].forEach((dir) => {
      let tlGeo: THREE.BufferGeometry;
      if (isGTR) {
        // Iconic round dual rings
        tlGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16);
      } else if (isWedgeSupercar || carDef.id === 'cyberion-ev') {
        // Continuous blade lightbar style
        tlGeo = new THREE.BoxGeometry(0.5, 0.06, 0.1);
      } else {
        tlGeo = new THREE.BoxGeometry(0.35, 0.14, 0.1);
      }
      const tlMesh = new THREE.Mesh(tlGeo, brakeLightMat);
      if (isGTR) {
        tlMesh.rotation.x = Math.PI / 2;
        tlMesh.position.set(dir * 0.6, 0.68, -2.12);
      } else {
        tlMesh.position.set(dir * 0.65, 0.68, -2.12);
      }
      group.add(tlMesh);
      brakeLights.push(tlMesh);

      // Rear Turn Signals
      const rtsGeo = new THREE.BoxGeometry(0.12, 0.08, 0.1);
      const rtsMesh = new THREE.Mesh(rtsGeo, turnSignalMat);
      rtsMesh.position.set(dir * 0.82, 0.68, -2.11);
      group.add(rtsMesh);
      if (dir < 0) leftTurnSignals.push(rtsMesh);
      else rightTurnSignals.push(rtsMesh);
    });

    // Rear diffuser
    const diffuserGeo = new THREE.BoxGeometry(bodyWidth * 0.85, 0.18, 0.4);
    const diffuser = new THREE.Mesh(diffuserGeo, carbon);
    diffuser.position.set(0, 0.28, -2.05);
    group.add(diffuser);

    // Exhaust pipes (not on EV)
    if (carDef.id !== 'cyberion-ev') {
      const isQuad = isSedan || isWedgeSupercar || isSupra;
      const pipeOffsets = isQuad ? [-0.55, -0.42, 0.42, 0.55] : [-0.5, 0.5];
      pipeOffsets.forEach((xOff) => {
        const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12);
        const pipe = new THREE.Mesh(pipeGeo, blackTrim);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(xOff, 0.28, -2.18);
        group.add(pipe);

        exhaustPositions.push(new THREE.Vector3(xOff, 0.28, -2.25));
      });
    }

    // Default Supra arch wing if Supra
    if (isSupra) {
      const archGeo = new THREE.BoxGeometry(1.6, 0.06, 0.3);
      const archWing = new THREE.Mesh(archGeo, paint);
      archWing.position.set(0, 1.15, -1.95);
      group.add(archWing);

      [-0.7, 0.7].forEach((side) => {
        const legGeo = new THREE.BoxGeometry(0.08, 0.4, 0.15);
        const leg = new THREE.Mesh(legGeo, paint);
        leg.position.set(side, 0.95, -1.95);
        group.add(leg);
      });
    }
  }

  private static createSpoiler(
    spoilerType: string,
    group: THREE.Group,
    paint: THREE.Material,
    carbon: THREE.Material
  ) {
    if (spoilerType === 'none') return;

    if (spoilerType === 'ducktail') {
      const dtGeo = new THREE.BoxGeometry(1.5, 0.12, 0.22);
      const dtMesh = new THREE.Mesh(dtGeo, carbon);
      dtMesh.position.set(0, 0.85, -2.05);
      dtMesh.rotation.x = -0.3;
      dtMesh.castShadow = true;
      group.add(dtMesh);
    } else if (spoilerType === 'gt') {
      // GT Wing
      const bladeGeo = new THREE.BoxGeometry(1.68, 0.04, 0.32);
      const bladeMesh = new THREE.Mesh(bladeGeo, carbon);
      bladeMesh.position.set(0, 1.15, -1.98);
      bladeMesh.rotation.x = -0.12;
      bladeMesh.castShadow = true;
      group.add(bladeMesh);

      // End plates
      [-0.84, 0.84].forEach((end) => {
        const plateGeo = new THREE.BoxGeometry(0.03, 0.18, 0.36);
        const plate = new THREE.Mesh(plateGeo, carbon);
        plate.position.set(end, 1.15, -1.98);
        group.add(plate);
      });

      // Mount struts
      [-0.45, 0.45].forEach((sx) => {
        const strutGeo = new THREE.BoxGeometry(0.04, 0.35, 0.08);
        const strut = new THREE.Mesh(strutGeo, carbon);
        strut.position.set(sx, 0.98, -1.98);
        group.add(strut);
      });
    } else if (spoilerType === 'massive') {
      // Track Massive Wing
      const bladeGeo = new THREE.BoxGeometry(1.85, 0.05, 0.38);
      const bladeMesh = new THREE.Mesh(bladeGeo, carbon);
      bladeMesh.position.set(0, 1.32, -2.02);
      bladeMesh.rotation.x = -0.16;
      bladeMesh.castShadow = true;
      group.add(bladeMesh);

      // Swan-neck hanging mounts
      [-0.48, 0.48].forEach((sx) => {
        const strutGeo = new THREE.BoxGeometry(0.05, 0.55, 0.1);
        const strut = new THREE.Mesh(strutGeo, carbon);
        strut.position.set(sx, 1.1, -1.98);
        strut.rotation.x = 0.2;
        group.add(strut);
      });
    }
  }

  private static buildWheel(
    style: string,
    rimMat: THREE.Material,
    caliperMat: THREE.Material,
    isLeft: boolean
  ): { wheelGroup: THREE.Group; tireMesh: THREE.Mesh; rimMesh: THREE.Mesh } {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireRadius = 0.34;
    const tireWidth = 0.26;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.9,
      metalness: 0.1,
    });
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.rotation.z = Math.PI / 2;
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Rim Outer Barrel
    const rimRadius = 0.23;
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.01, 24);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.z = Math.PI / 2;
    wheelGroup.add(rimMesh);

    // Spokes Pattern
    const spokeGroup = new THREE.Group();
    const count = style === 'mesh' ? 12 : 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(0.04, rimRadius * 1.8, 0.02);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.rotation.z = angle;
      spoke.position.x = isLeft ? -0.1 : 0.1;
      spokeGroup.add(spoke);
    }
    wheelGroup.add(spokeGroup);

    // Brake Disc & Red Caliper (non-spinning)
    const discGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.3,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = isLeft ? 0.04 : -0.04;
    wheelGroup.add(disc);

    const caliperGeo = new THREE.BoxGeometry(0.06, 0.12, 0.08);
    const redCaliperMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.6,
      roughness: 0.3,
    });
    const caliper = new THREE.Mesh(caliperGeo, redCaliperMat);
    caliper.position.set(isLeft ? 0.04 : -0.04, 0.12, 0);
    wheelGroup.add(caliper);

    return { wheelGroup, tireMesh, rimMesh };
  }
}
