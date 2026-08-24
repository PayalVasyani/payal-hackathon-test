import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      accountType: ['BROKER', Validators.required],
      companyName: ['', Validators.required]
    });

    // Dynamically require company name based on account type
    this.registerForm.get('accountType')?.valueChanges.subscribe(type => {
      const companyControl = this.registerForm.get('companyName');
      if (type === 'SHIPPER') {
        companyControl?.clearValidators();
      } else {
        companyControl?.setValidators(Validators.required);
      }
      companyControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.success = '';

    const val = this.registerForm.value;

    this.authService.register(val).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = 'Registration successful! You can now log in.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
