import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-layout.html',
})
export class GameLayout {
  mobilePanelOpen = signal(false);

  togglePanel() {
    this.mobilePanelOpen.update(v => !v);
  }
}
