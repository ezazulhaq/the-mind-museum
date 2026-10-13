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
      description: 'Test your typing velocity, accuracy, and reflex response against falling cybernetic data streams.',
      route: '/games/terminal-velocity',
      techBadge: 'Kinesthetic Reflex',
      level: 'Introductory',
    },
    {
      id: 'node-network',
      title: 'Node Network',
      wing: 'Systems Wing',
      discipline: 'Graph Theory & Routing',
      description: 'Navigate data packets through complex interconnected topologies to discover optimal routing paths.',
      route: '/games/node-network',
      techBadge: 'Pathfinding & Topology',
      level: 'Intermediate',
    },
    {
      id: 'logic-gate-defender',
      title: 'Logic Gate Defender',
      wing: 'Circuitry Wing',
      discipline: 'Boolean Logic & Circuitry',
      description: 'Defend your computational core by placing AND, OR, XOR, NAND, and NOR gates in defensive towers.',
      route: '/games/logic-gate-defender',
      techBadge: 'Boolean Architecture',
      level: 'Intermediate',
    },
    {
      id: 'contraption-crafter',
      title: 'Contraption Crafter',
      wing: 'Mechanics Wing',
      discipline: 'Classical Mechanics & Physics',
      description: 'Engineer elaborate kinetic chain reactions using physics-based ramps, elastic bouncers, and air currents.',
      route: '/games/contraption-crafter',
      techBadge: 'Kinetic Physics',
      level: 'Advanced',
    },
    {
      id: 'algorithmic-alchemist',
      title: 'Algorithmic Alchemist',
      wing: 'Logic Wing',
      discipline: 'Procedural Automation',
      description: 'Craft programmatic command sequences using visual logic blocks, iterative loops, and directional logic.',
      route: '/games/algorithmic-alchemist',
      techBadge: 'Visual Sequencing',
      level: 'Introductory',
    },
    {
      id: 'optic-architect',
      title: 'Optic Architect',
      wing: 'Dimensions Wing',
      discipline: '3D Spatial Geometry',
      description: 'Rotate complex isometric polyhedral structures across axes to align 3D geometry with 2D projections.',
      route: '/games/optic-architect',
      techBadge: 'Spatial Reasoning',
      level: 'Advanced',
    },
  ]);

  readonly selectedWing = signal<string>('All');
  readonly searchQuery = signal<string>('');

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
        exhibit.wing.toLowerCase().includes(query);
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
}
