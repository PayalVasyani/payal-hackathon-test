import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadsService } from '../../services/loads.service';
import { UserService } from '../../../core/services/user.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-load-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './load-details.component.html',
  styleUrls: ['./load-details.component.css']
})
export class LoadDetailsComponent implements OnInit {
  load: any = null;
  loading = true;
  error = '';
  
  // Permissions
  canAssignCarrier = false;
  canOverrideCompliance = false;
  canCreateRate = false;
  canConfirmRate = false;

  // Forms
  assignForm: FormGroup;
  rateForm: FormGroup;

  assignError = '';
  assignSuccess = '';
  rateError = '';
  rateSuccess = '';
  
  complianceBlocked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loadsService: LoadsService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.assignForm = this.fb.group({
      carrierOrganizationId: ['', Validators.required],
      overrideCompliance: [false]
    });

    this.rateForm = this.fb.group({
      baseRate: [0, [Validators.required, Validators.min(1)]],
      accessorials: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.canAssignCarrier = this.userService.hasPermission('load.assign_carrier');
    this.canOverrideCompliance = this.userService.hasPermission('load.override_compliance_flag');
    this.canCreateRate = this.userService.hasPermission('rate.create');
    this.canConfirmRate = this.userService.hasPermission('rate.confirm');

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchLoad(id);
      }
    });
  }

  fetchLoad(id: string, forceRefresh = false): void {
    this.loadsService.getLoad(id, forceRefresh).subscribe({
      next: (data) => {
        if (!data) {
          this.error = 'Load not found.';
        } else {
          this.load = data;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to fetch load details.';
        this.loading = false;
      }
    });
  }

  assigning = false;

  onAssignCarrier(): void {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    
    this.assignError = '';
    this.assignSuccess = '';
    this.assigning = true;
    const val = this.assignForm.value;

    this.loadsService.assignCarrier(this.load.id, val.carrierOrganizationId, val.overrideCompliance).subscribe({
      next: () => {
        this.assignSuccess = 'Carrier assigned successfully.';
        this.complianceBlocked = false;
        this.assigning = false;
        this.assignForm.reset();
        this.fetchLoad(this.load.id, true);
      },
      error: (err) => {
        this.assigning = false;
        if (err.status === 400 && err.error?.message?.includes('compliance blocked')) {
          this.assignError = 'Carrier compliance failed. Override is required.';
          this.complianceBlocked = true;
        } else if (err.status === 403) {
          this.assignError = 'You do not have permission to perform this action.';
        } else if (err.status === 400 && err.error?.message?.includes('not found')) {
          this.assignError = 'Carrier organization not found. Please select a valid carrier.';
        } else {
          this.assignError = err.error?.message || 'Failed to assign carrier.';
        }
      }
    });
  }

  creatingRate = false;

  onCreateRate(): void {
    if (this.rateForm.invalid) return;
    
    this.rateError = '';
    this.rateSuccess = '';
    this.creatingRate = true;

    this.loadsService.createRate(this.load.id, this.rateForm.value).subscribe({
      next: () => {
        this.rateSuccess = 'Draft rate created successfully.';
        this.creatingRate = false;
        this.rateForm.reset({ baseRate: 0, accessorials: 0 });
        this.fetchLoad(this.load.id, true);
      },
      error: (err) => {
        this.creatingRate = false;
        this.rateError = err.error?.message || 'Failed to create rate.';
      }
    });
  }

  onConfirmRate(version: number): void {
    this.loadsService.confirmRate(this.load.id, version).subscribe({
      next: () => {
        this.fetchLoad(this.load.id, true);
      },
      error: (err) => {
        alert(err.status === 403 ? 'You do not have permission to confirm this rate.' : 'Failed to confirm rate.');
      }
    });
  }
}
