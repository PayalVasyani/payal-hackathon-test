import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoadsService } from '../../services/loads.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-load-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './load-create.component.html',
  styleUrls: ['./load-create.component.css']
})
export class LoadCreateComponent implements OnInit {
  loadForm: FormGroup;
  submitting = false;
  error = '';
  shippers: any[] = [];
  loadingShippers = true;

  equipmentTypes = ['DRY_VAN', 'FLATBED', 'REEFER', 'STEP_DECK'];

  constructor(
    private fb: FormBuilder,
    private loadsService: LoadsService,
    private router: Router
  ) {
    this.loadForm = this.fb.group({
      shipperId: ['', [Validators.required]],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      pickupDate: [''],
      deliveryDate: [''],
      equipmentType: ['', Validators.required],
      commodity: ['', Validators.required],
      weight: ['', Validators.min(0)],
      targetOffer: ['', Validators.min(0)]
    });
  }

  ngOnInit(): void {
    this.loadsService.getShippers().subscribe({
      next: (data) => {
        this.shippers = data;
        this.loadingShippers = false;
        if (this.shippers.length > 0) {
          this.loadForm.patchValue({ shipperId: this.shippers[0].id });
        }
      },
      error: () => this.loadingShippers = false
    });
  }

  onSubmit(): void {
    if (this.loadForm.invalid) return;
    
    this.submitting = true;
    
    const payload = { ...this.loadForm.value };
    if (payload.targetOffer === '') payload.targetOffer = null;
    if (payload.weight === '') payload.weight = null;
    if (payload.pickupDate === '') payload.pickupDate = null;
    if (payload.deliveryDate === '') payload.deliveryDate = null;

    this.loadsService.createLoad(payload).subscribe({
      next: (res) => {
        this.router.navigate(['/loads', res.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.parseError(err);
      }
    });
  }

  private parseError(err: any): string {
    if (err.status === 400) return err.error?.message || 'Invalid load data provided.';
    if (err.status === 403) return 'Permission denied. Only brokers can create loads.';
    return 'An error occurred while creating the load.';
  }
}
