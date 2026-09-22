import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-optic-architect',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './optic-architect.html',
  styleUrl: './optic-architect.scss'
})
export class OpticArchitect implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);

  private scene: any;
  private camera: any;
  private renderer: any;
  private animationFrameId: number | null = null;
  private cubes: any[] = [];

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
      
      const targetRotation = { x: Math.PI / 4, y: Math.PI / 4 }; // Specific angle to win
      let hasWon = false;

      // HTML overlay text for UI
      const uiDiv = document.createElement('div');
      uiDiv.style.position = 'absolute';
      uiDiv.style.top = '20px';
      uiDiv.style.left = '20px';
      uiDiv.style.color = 'white';
      uiDiv.style.fontFamily = 'monospace';
      uiDiv.style.fontSize = '18px';
      uiDiv.style.pointerEvents = 'none';
      uiDiv.innerHTML = 'Drag to rotate the shape.<br>Align it to see a perfect "L".';
      this.container.nativeElement.style.position = 'relative';
      this.container.nativeElement.appendChild(uiDiv);

      this.renderer.domElement.addEventListener('pointerdown', (event: any) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      });
      
      this.renderer.domElement.addEventListener('pointerup', () => {
        isDragging = false;
      });

      this.renderer.domElement.addEventListener('pointermove', (event: any) => {
        if (isDragging && !hasWon) {
          const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
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
            hasWon = true;
            uiDiv.innerHTML = '<span style="color: #10b981; font-size: 24px; font-weight: bold">Alignment Complete!</span><br>Perspective matched.';
            group.rotation.x = 0;
            group.rotation.y = 0;
          }
        }
      });

      // Animation Loop
      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);
        
        // No auto-rotation anymore; manual rotation only
        
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
    this.cubes.forEach(cube => {
      cube.geometry.dispose();
      cube.material.dispose();
    });
  }
}
