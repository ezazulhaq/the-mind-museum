import { Component, inject, OnInit, ViewChild, ElementRef, PLATFORM_ID, signal, effect, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { OfflineDbService } from '../../services/offline-db.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css'
})
export class AnalyticsDashboard implements OnInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private offlineDb = inject(OfflineDbService);
  private platformId = inject(PLATFORM_ID);

  stats = signal<any>(null);
  loading = signal<boolean>(true);

  // Cognitive domain mapping
  domainMap: Record<string, string> = {
    'terminal-velocity': 'Typing / Motor',
    'node-network': 'Systems / Spatial',
    'logic-gate-defender': 'Logic / Boolean',
    'contraption-crafter': 'Physics / Cause-Effect',
    'algorithmic-alchemist': 'Sequencing / Procedural',
    'optic-architect': 'Spatial / Rotation'
  };

  maxSessionCount = computed(() => {
    const s = this.stats();
    if (!s || !s.sessionCountByGame?.length) return 1;
    return Math.max(...s.sessionCountByGame.map((g: any) => g.count), 1);
  });

  constructor() {
    // No longer need to draw canvas manually!
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stats = await this.offlineDb.getAnalytics();
        this.stats.set(stats);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        this.loading.set(false);
      }
    }
  }

  getDomain(gameId: string): string {
    return this.domainMap[gameId] || gameId;
  }

  formatGameName(id: string): string {
    return (id || '').split('-').map((w: string) => w[0]?.toUpperCase()).join('');
  }
}
