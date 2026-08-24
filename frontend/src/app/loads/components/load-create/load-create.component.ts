import { Component } from '@angular/core';
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
export class LoadCreateComponent {
  createForm: FormGroup;
  loading = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private loadsService: LoadsService,
    private router: Router
  ) {
    this.createForm = this.fb.group({
      shipperId: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.createForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = false;

    // Send only shipperId, never backend controlled fields
    this.loadsService.createLoad({ shipperId: this.createForm.value.shipperId }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.createForm.reset();
        setTimeout(() => this.router.navigate(['/loads']), 1500);
      },
      error: (err) => {
        this.loading = false;
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
