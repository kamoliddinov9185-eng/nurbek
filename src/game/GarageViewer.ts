import * as THREE from 'three';
import { BuiltCar, CarBuilder } from './CarBuilder';
import { CarDefinition, CarCustomization } from '../types/game';

export class GarageViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private currentCar: BuiltCar | null = null;
  private turntable: THREE.Group;
  private animId: number | null = null;
  private isDestroyed: boolean = false;
  private autoRotate: boolean = true;
  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    this.camera.position.set(4.5, 2.2, 5.5);
    this.camera.lookAt(0, 0.6, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Overhead showroom key lights
    const keySpot = new THREE.SpotLight(0xffffff, 5.0, 30, Math.PI / 4, 0.3, 1.2);
    keySpot.position.set(3, 7, 3);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 1024;
    keySpot.shadow.mapSize.height = 1024;
    this.scene.add(keySpot);

    const fillSpot = new THREE.SpotLight(0x38bdf8, 3.5, 30, Math.PI / 4, 0.4, 1.2);
    fillSpot.position.set(-4, 5, -3);
    this.scene.add(fillSpot);

    const rimSpot = new THREE.SpotLight(0xf43f5e, 2.8, 30, Math.PI / 3, 0.4, 1.2);
    rimSpot.position.set(0, 4, -5);
    this.scene.add(rimSpot);

    // Turntable platform
    this.turntable = new THREE.Group();
    this.scene.add(this.turntable);

    // Platform disc
    const platGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.25, 48);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.y = -0.125;
    platform.receiveShadow = true;
    this.turntable.add(platform);

    // Glowing platform outer ring
    const ringGeo = new THREE.TorusGeometry(3.7, 0.05, 12, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.turntable.add(ring);

    // Showroom floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.3,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.26;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Setup mouse drag rotation
    this.setupInteractions();
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  public displayCar(carDef: CarDefinition, customization: CarCustomization) {
    if (this.currentCar) {
      this.turntable.remove(this.currentCar.root);
    }

    this.currentCar = CarBuilder.buildCar(carDef, customization);
    // Raise car onto turntable
    this.currentCar.root.position.set(0, 0, 0);
    this.turntable.add(this.currentCar.root);

    // Reset turntable rotation gently
    this.turntable.rotation.y = -0.4;
  }

  public updateCarCustomization(customization: CarCustomization, carDef: CarDefinition) {
    // Re-build car to reflect structural changes (spoiler, wheels) and update shaders
    this.displayCar(carDef, customization);
  }

  private setupInteractions() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      this.turntable.rotation.y += deltaX * 0.01;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        setTimeout(() => {
          this.autoRotate = true;
        }, 3000);
      }
    });

    // Touch support for mobile/tablet
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      this.turntable.rotation.y += deltaX * 0.01;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
      setTimeout(() => {
        this.autoRotate = true;
      }, 3000);
    });
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = () => {
    if (this.isDestroyed) return;

    if (this.autoRotate) {
      this.turntable.rotation.y += 0.006;
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.animate);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
