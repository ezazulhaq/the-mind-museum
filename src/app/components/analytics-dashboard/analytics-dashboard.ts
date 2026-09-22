import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.scss'
})
export class AnalyticsDashboard implements OnInit {
  private http = inject(HttpClient);
  
  stats: any = null;
  loading = true;

  ngOnInit() {
    this.http.get('/api/analytics').subscribe({
      next: (res: any) => {
        this.stats = res.stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.loading = false;
      }
    });
  }
}
