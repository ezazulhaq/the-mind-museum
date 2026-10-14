import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface MuseumExhibit {
  id: string;
  title: string;
  wing: string;
  discipline: string;
  description: string;
  route: string;
  techBadge: string;
  level: 'Introductory' | 'Intermediate' | 'Advanced';
  difficultyRating: number; // 1, 2, or 3
  duration: string;
  skills: string[];
  gradient: string;
  previewType: 'terminal' | 'network' | 'circuit' | 'physics' | 'alchemy' | 'optic';
  accentColor: string;
}

@Component({
  selector: 'app-exhibits',
  imports: [RouterLink],
  templateUrl: './exhibits.html',
  styleUrl: './exhibits.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Exhibits {
  readonly exhibits = signal<MuseumExhibit[]>([
    {
      id: 'terminal-velocity',
      title: 'Terminal Velocity',
      wing: 'Cybernetics Wing',
      discipline: 'Typing & Kinesthetics',
      description: 'Test your typing velocity, accuracy, and reflex response against descending cybernetic data streams in real-time.',
      route: '/games/terminal-velocity',
      techBadge: 'Reactive Motion & Keystrokes',
      level: 'Introductory',
      difficultyRating: 1,
      duration: '3–5 min',
      skills: ['WPM Velocity', 'Touch-Typing', 'Prefix Recognition'],
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      previewType: 'terminal',
      accentColor: 'cyan',
    },
    {
      id: 'node-network',
      title: 'Node Network',
      wing: 'Systems Wing',
      discipline: 'Graph Theory & Routing',
      description: 'Navigate data packets through complex interconnected topologies to discover optimal routing pathways with minimal hops.',
      route: '/games/node-network',
      techBadge: 'Phaser 4 Engine',
      level: 'Intermediate',
      difficultyRating: 2,
      duration: '5–8 min',
      skills: ['Pathfinding', 'Graph Topology', 'Route Efficiency'],
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      previewType: 'network',
      accentColor: 'emerald',
    },
    {
      id: 'logic-gate-defender',
      title: 'Logic Gate Defender',
      wing: 'Circuitry Wing',
      discipline: 'Boolean Logic & Circuitry',
      description: 'Defend your computational core by placing AND, OR, XOR, NAND, and NOR gates in defensive towers against digital signals.',
      route: '/games/logic-gate-defender',
      techBadge: 'Phaser 4 + Boolean Core',
      level: 'Intermediate',
      difficultyRating: 2,
      duration: '6–10 min',
      skills: ['Boolean Truth Tables', 'Circuit Architecture', 'Wave Defense'],
      gradient: 'from-violet-500/20 via-indigo-500/10 to-transparent',
      previewType: 'circuit',
      accentColor: 'violet',
    },
    {
      id: 'contraption-crafter',
      title: 'Contraption Crafter',
      wing: 'Mechanics Wing',
      discipline: 'Classical Mechanics & Physics',
      description: 'Engineer elaborate kinetic chain reactions using physics-based ramps, elastic bouncers, and directional air currents.',
      route: '/games/contraption-crafter',
      techBadge: 'Phaser 4 + Matter.js',
      level: 'Advanced',
      difficultyRating: 3,
      duration: '8–12 min',
      skills: ['Kinetic Energy', 'Elastic Collisions', 'Trajectory Math'],
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      previewType: 'physics',
      accentColor: 'amber',
    },
    {
      id: 'algorithmic-alchemist',
      title: 'Algorithmic Alchemist',
      wing: 'Logic Wing',
      discipline: 'Procedural Automation',
      description: 'Craft programmatic command sequences using visual logic blocks, iterative repeat loops, and conditional turn triggers.',
      route: '/games/algorithmic-alchemist',
      techBadge: 'Angular CDK Drag & Drop',
      level: 'Introductory',
      difficultyRating: 1,
      duration: '4–7 min',
      skills: ['Loop Iteration', 'Conditional Logic', 'Algorithmic Sequencing'],
      gradient: 'from-fuchsia-500/20 via-purple-500/10 to-transparent',
      previewType: 'alchemy',
      accentColor: 'fuchsia',
    },
    {
      id: 'optic-architect',
      title: 'Optic Architect',
      wing: 'Dimensions Wing',
      discipline: '3D Spatial Geometry',
      description: 'Rotate complex isometric polyhedral structures across 3D axes to perfectly align perspectives with target 2D projections.',
      route: '/games/optic-architect',
      techBadge: 'Three.js WebGL Engine',
      level: 'Advanced',
      difficultyRating: 3,
      duration: '6–10 min',
      skills: ['Mental Rotation', 'Isometric Projection', 'Spatial Axes'],
      gradient: 'from-sky-500/20 via-indigo-500/10 to-transparent',
      previewType: 'optic',
      accentColor: 'sky',
    },
  ]);

  readonly selectedWing = signal<string>('All');
  readonly searchQuery = signal<string>('');
  readonly activeModalExhibit = signal<MuseumExhibit | null>(null);

  readonly wings = computed(() => {
    const list = new Set(this.exhibits().map((e) => e.wing));
    return ['All', ...Array.from(list)];
  });

  readonly filteredExhibits = computed(() => {
    const wing = this.selectedWing();
    const query = this.searchQuery().trim().toLowerCase();

    return this.exhibits().filter((exhibit) => {
      const matchesWing = wing === 'All' || exhibit.wing === wing;
      const matchesQuery =
        !query ||
        exhibit.title.toLowerCase().includes(query) ||
        exhibit.description.toLowerCase().includes(query) ||
        exhibit.discipline.toLowerCase().includes(query) ||
        exhibit.wing.toLowerCase().includes(query) ||
        exhibit.skills.some((s) => s.toLowerCase().includes(query));
      return matchesWing && matchesQuery;
    });
  });

  setWing(wing: string) {
    this.selectedWing.set(wing);
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearFilters() {
    this.selectedWing.set('All');
    this.searchQuery.set('');
  }

  openDetails(exhibit: MuseumExhibit) {
    this.activeModalExhibit.set(exhibit);
  }

  closeDetails() {
    this.activeModalExhibit.set(null);
  }
}
