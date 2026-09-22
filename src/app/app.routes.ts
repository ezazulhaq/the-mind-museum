import { Routes } from '@angular/router';
import { Lobby } from './components/lobby/lobby';
import { ProfileSelector } from './components/profile-selector/profile-selector';
import { GameDashboard } from './components/game-dashboard/game-dashboard';
import { TerminalVelocity } from './components/games/terminal-velocity/terminal-velocity';
import { AlgorithmicAlchemist } from './components/games/algorithmic-alchemist/algorithmic-alchemist';

export const routes: Routes = [
  { path: '', component: Lobby },
  { path: 'profile', component: ProfileSelector },
  { path: 'dashboard', component: GameDashboard },
  { path: 'games/terminal-velocity', component: TerminalVelocity },
  { path: 'games/algorithmic-alchemist', component: AlgorithmicAlchemist },
];
