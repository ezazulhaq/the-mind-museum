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

      const addCube = (x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        
        // Add edges for better visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(line);
        
        this.cubes.push(mesh);
      };

      addCube(0, 1, 0);
      addCube(2, 1, 0);
      addCube(0, 3, 0);

      // Raycaster for interactivity
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      this.renderer.domElement.addEventListener('pointerdown', (event: any) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.cubes, false);

        if (intersects.length > 0) {
          const object = intersects[0].object as any;
          // Toggle color on click
          if (object.material.color.getHex() === 0x38bdf8) {
            object.material.color.setHex(0x10b981); // Green
          } else {
            object.material.color.setHex(0x38bdf8); // Blue
          }
        }
      });

      // Animation Loop
      const animate = () => {
        this.animationFrameId = requestAnimationFrame(animate);
        
        // Slowly rotate the entire scene so player can see structure from different angles
        this.scene.rotation.y += 0.005;
        
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
