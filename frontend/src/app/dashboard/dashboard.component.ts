import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = null;
  error: string = '';
  loading: boolean = true;
  loads: any[] = [];
  createLoadShipperId: string = 'shipper-123';
  assignCarrierOrgId: string = 'carrier-123';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchUser();
    this.fetchLoads();
  }

  fetchUser() {
    this.http.get(`${environment.apiUrl}/users/me`).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user profile.';
        this.loading = false;
      }
    });
  }

  fetchLoads() {
    this.http.get(`${environment.apiUrl}/loads`).subscribe({
      next: (data: any) => this.loads = data,
      error: (err) => console.error('Failed to fetch loads', err)
    });
  }

  createLoad() {
    this.http.post(`${environment.apiUrl}/loads`, { shipperId: this.createLoadShipperId }).subscribe({
      next: () => this.fetchLoads(),
      error: (err) => alert('Failed to create load: ' + err.message)
    });
  }

  assignCarrier(loadId: string) {
    this.http.patch(`${environment.apiUrl}/loads/${loadId}/assign-carrier`, { 
      carrierOrganizationId: this.assignCarrierOrgId 
    }).subscribe({
      next: () => this.fetchLoads(),
      error: (err) => alert('Failed to assign carrier: ' + err.message)
    });
  }

  createRate(loadId: string) {
    this.http.post(`${environment.apiUrl}/loads/${loadId}/rates`, { baseRate: 1000, accessorials: 200 }).subscribe({
      next: () => this.fetchLoads(),
      error: (err) => alert('Failed to create rate: ' + err.message)
    });
  }

  confirmRate(loadId: string, version: number) {
    this.http.patch(`${environment.apiUrl}/loads/${loadId}/rates/${version}/confirm`, {}).subscribe({
      next: () => this.fetchLoads(),
      error: (err) => alert('Failed to confirm rate: ' + err.message)
    });
  }
}
