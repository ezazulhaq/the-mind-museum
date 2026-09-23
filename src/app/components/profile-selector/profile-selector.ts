import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PlayerStateService } from '../../services/player-state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-selector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile-selector.html',
  styleUrl: './profile-selector.css',
})
export class ProfileSelector {
  username = signal<string>('');
  loading = signal<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private playerState = inject(PlayerStateService);

  async createProfile() {
    const name = this.username().trim();
    if (!name) return;

    this.loading.set(true);

    try {
      await this.playerState.setPlayer(name);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Error creating profile', err);
      this.loading.set(false);
    }
  }
}

