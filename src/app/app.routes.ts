import { Routes } from '@angular/router';
import { Lobby } from './components/lobby/lobby';
import { ProfileSelector } from './components/profile-selector/profile-selector';
import { GameDashboard } from './components/game-dashboard/game-dashboard';
import { TerminalVelocity } from './components/games/terminal-velocity/terminal-velocity';
import { AlgorithmicAlchemist } from './components/games/algorithmic-alchemist/algorithmic-alchemist';
import { NodeNetwork } from './components/games/node-network/node-network';
import { LogicGateDefender } from './components/games/logic-gate-defender/logic-gate-defender';
import { ContraptionCrafter } from './components/games/contraption-crafter/contraption-crafter';
import { OpticArchitect } from './components/games/optic-architect/optic-architect';
import { AnalyticsDashboard } from './components/analytics-dashboard/analytics-dashboard';

export const routes: Routes = [
  { path: '', component: Lobby },
  { path: 'profile', component: ProfileSelector },
  { path: 'dashboard', component: GameDashboard },
  { path: 'analytics', component: AnalyticsDashboard },
  { path: 'games/terminal-velocity', component: TerminalVelocity },
  { path: 'games/node-network', component: NodeNetwork },
  { path: 'games/logic-gate-defender', component: LogicGateDefender },
  { path: 'games/contraption-crafter', component: ContraptionCrafter },
  { path: 'games/algorithmic-alchemist', component: AlgorithmicAlchemist },
  { path: 'games/optic-architect', component: OpticArchitect },
];
