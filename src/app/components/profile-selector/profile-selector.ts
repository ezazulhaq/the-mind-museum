import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerStateService } from '../../services/player-state.service';

@Component({
  selector: 'app-profile-selector',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile-selector.html',
  styleUrl: './profile-selector.scss'
})
export class ProfileSelector {
  username: string = '';
  loading = false;

  private http = inject(HttpClient);
  private router = inject(Router);
  private playerState = inject(PlayerStateService);

  createProfile() {
    if (!this.username.trim()) return;
    this.loading = true;

    this.http.post<{ success: boolean, id: number }>('/api/players', {
      username: this.username
    }).subscribe({
      next: (res) => {
        this.playerState.setPlayer(res.id, this.username);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error creating profile', err);
        this.loading = false;
      }
    });
  }
}
