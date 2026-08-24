import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LoadsService } from '../loads/services/loads.service';
import { UserService } from '../core/services/user.service';
import { AuthService } from '../auth/auth.service';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = null;
  
  // Dashboard Metrics
  totalLoads = 0;
  postedLoads = 0;
  carrierAssignedLoads = 0;
  complianceIssues = 0;
  confirmedRates = 0;

  loading = true;
  error = '';

  constructor(
    private loadsService: LoadsService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.appUser$.subscribe((u: any) => {
      this.user = u;
      if (this.user) {
        this.fetchMetrics();
      }
    });
  }

  fetchMetrics(): void {
    this.loading = true;
    this.loadsService.getLoads().subscribe({
      next: (loads: any[]) => {
        this.totalLoads = loads.length;
        this.postedLoads = loads.filter(l => l.status === 'POSTED').length;
        this.carrierAssignedLoads = loads.filter(l => l.status === 'CARRIER_ASSIGNED').length;
        this.complianceIssues = loads.filter(l => l.complianceStatus === 'BLOCKED' || (l.complianceIssues && l.complianceIssues.length > 0 && l.complianceStatus !== 'OVERRIDDEN')).length;
        
        let rates = 0;
        loads.forEach(l => {
          if (l.rates && l.rates.some((r: any) => r.status === 'CONFIRMED')) {
            rates++;
          }
        });
        this.confirmedRates = rates;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load dashboard metrics.';
        this.loading = false;
      }
    });
  }
}

