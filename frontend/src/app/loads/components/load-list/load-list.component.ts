import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoadsService } from '../../services/loads.service';
import { UserService } from '../../../core/services/user.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-load-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './load-list.component.html',
  styleUrls: ['./load-list.component.css']
})
export class LoadListComponent implements OnInit {
  loads: any[] = [];
  loading = true;
  error = '';
  canCreateLoad = false;

  constructor(
    private loadsService: LoadsService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.canCreateLoad = this.userService.hasPermission('load.create');
    this.fetchLoads();
  }

  fetchLoads(): void {
    this.loading = true;
    this.error = '';
    this.loadsService.getLoads().subscribe({
      next: (data) => {
        this.loads = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching loads', err);
        this.error = this.parseError(err);
        this.loading = false;
      }
    });
  }

  viewDetails(id: string): void {
    this.router.navigate(['/loads', id]);
  }

  private parseError(err: any): string {
    if (err.status === 401) return 'Session expired. Please log in again.';
    if (err.status === 403) return 'You do not have permission to view loads.';
    return err.error?.message || 'Failed to fetch loads. Please try again.';
  }
}
