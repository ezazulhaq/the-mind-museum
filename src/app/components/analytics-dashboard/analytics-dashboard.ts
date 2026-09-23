import { Component, inject, OnInit, ViewChild, ElementRef, PLATFORM_ID, signal, effect } from '@angular/core';
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

  constructor() {
    // Automatically draw the chart when stats are populated
    effect(() => {
      const data = this.stats();
      if (data && !this.loading()) {
        setTimeout(() => this.drawChart(), 100);
      }
    });
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

  drawChart() {
    if (!this.chartCanvas || !isPlatformBrowser(this.platformId)) return;
    if (!this.stats()?.sessionCountByGame?.length) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats().sessionCountByGame;
    const barWidth = 60;
    const gap = 30;
    const chartHeight = 180;
    const offsetX = 40;
    const offsetY = 20;

    canvas.width = offsetX + data.length * (barWidth + gap) + gap;
    canvas.height = chartHeight + 80;

    // Find max value
    const maxVal = Math.max(...data.map((d: any) => d.count), 1);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Y-axis
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX, offsetY + chartHeight);
    ctx.stroke();

    // Bars
    const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
    data.forEach((d: any, i: number) => {
      const barH = (d.count / maxVal) * chartHeight;
      const x = offsetX + gap + i * (barWidth + gap);
      const y = offsetY + chartHeight - barH;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y, barWidth, barH);

      // Value label
      ctx.fillStyle = '#f8fafc';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.count.toString(), x + barWidth / 2, y - 5);

      // Game label (abbreviated)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      const label = (d.game_id || '').split('-').map((w: string) => w[0]?.toUpperCase()).join('');
      ctx.fillText(label || '?', x + barWidth / 2, offsetY + chartHeight + 15);
    });

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Sessions per Game', offsetX + 5, offsetY + chartHeight + 40);
  }
}
