import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.css'
})
export class GameDashboard {
  games = [
    { id: 'g1', title: 'Terminal Velocity', description: 'Typing defense game testing keystroke muscle memory.', wing: 'Cybernetics Wing' },
    { id: 'g2', title: 'Node Network', description: 'Grid-based puzzle focusing on network topology.', wing: 'Systems Wing' },
    { id: 'g3', title: 'Logic Gate Defender', description: 'Tower defense requiring Boolean logic.', wing: 'Circuitry Wing' },
    { id: 'g4', title: 'Contraption Crafter', description: 'Build Rube Goldberg machines.', wing: 'Mechanics Wing' },
    { id: 'g5', title: 'Algorithmic Alchemist', description: 'Procedural sequencing game using loops.', wing: 'Logic Wing' },
    { id: 'g6', title: 'Optic Architect', description: 'Isometric 3D puzzle testing mental rotation.', wing: 'Dimensions Wing' }
  ];
}
