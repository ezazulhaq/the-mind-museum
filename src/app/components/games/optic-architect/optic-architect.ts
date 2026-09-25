import {
  Component,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { GameLayout } from '../../game-layout/game-layout';

@Component({
  selector: 'app-optic-architect',
  standalone: true,
  imports: [GameLayout],
  templateUrl: './optic-architect.html',
  styleUrl: './optic-architect.css',
})
export class OpticArchitect implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);

  private scene: any;
  private camera: any;
  private renderer: any;
  private animationFrameId: number | null = null;
  private cubes: any[] = [];

  hasWon = signal(false);

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const THREE = await import('three');

      const width = 800;
      const height = 600;

      // Setup Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0f172a);

      // Orthographic Camera for isometric view
      const aspect = width / height;
      const d = 10;
      this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

      // Isometric positioning
      this.camera.position.set(20, 20, 20); // Looking from a diagonal
      this.camera.lookAt(this.scene.position); // Look at center

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(width, height);
      this.container.nativeElement.appendChild(this.renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(20, 40, -15);
      this.scene.add(directionalLight);

      // Add a grid helper
      const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x334155);
      this.scene.add(gridHelper);

      // Create a 3D puzzle structure (L-shape)
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

      // Add a group to hold our puzzle blocks
      const group = new THREE.Group();
      this.scene.add(group);

      const addCube = (x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        group.add(mesh); // Add to group instead of scene

        // Add edges for better visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(line);

        this.cubes.push(mesh);
      };

      addCube(0, 0, 0);
      addCube(2, 0, 0);
      addCube(0, 2, 0);
      addCube(0, 0, 2);

      // Manual Rotation variables
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      // Raycaster for click-to-select cubes
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let clickStart = { x: 0, y: 0 };

      this.renderer.domElement.addEventListener('pointerdown', (event: any) => {
        isDragging = true;
        clickStart = { x: event.clientX, y: event.clientY };
        previousMousePosition = { x: event.clientX, y: event.clientY };
      });

      this.renderer.domElement.addEventListener('pointerup', (event: any) => {
        // If the mouse barely moved, treat as a click (raycasting)
        const dx = event.clientX - clickStart.x;
        const dy = event.clientY - clickStart.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          const rect = this.renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

          raycaster.setFromCamera(mouse, this.camera);
          const intersects = raycaster.intersectObjects(this.cubes, false);

          if (intersects.length > 0) {
            const obj = intersects[0].object as any;
            // Toggle selection color
            if (obj.material.color.getHex() === 0x38bdf8) {
              obj.material = new THREE.MeshLambertMaterial({ color: 0x10b981 });
            } else {
              obj.material = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
            }
          }
        }
        isDragging = false;
      });

      this.renderer.domElement.addEventListener('pointermove', (event: any) => {
        if (isDragging && !this.hasWon()) {
          const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
          };

          group.rotation.y += deltaMove.x * 0.01;
          group.rotation.x += deltaMove.y * 0.01;

          previousMousePosition = { x: event.clientX, y: event.clientY };

          // Check win condition (very rough alignment check)
          // Normalize rotation to 0 - 2PI
          const rotX = Math.abs(group.rotation.x % (Math.PI * 2));
          const rotY = Math.abs(group.rotation.y % (Math.PI * 2));

          // If looking straight at the XY plane (z-axis alignment)
          if (rotX < 0.2 && rotY < 0.2) {
            this.hasWon.set(true);
            group.rotation.x = 0;
            group.rotation.y = 0;
          }
        }
      });

      // Animation Loop
      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);
        this.renderer.render(this.scene, this.camera);
      };

      animate();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    // Clean up ThreeJS scene
    this.cubes.forEach((cube) => {
      cube.geometry.dispose();
      cube.material.dispose();
    });
  }
}
