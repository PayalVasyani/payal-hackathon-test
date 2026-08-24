import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  error = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient
  ) {}

  async onSubmit(event: Event) {
    event.preventDefault();
    this.isLoading = true;
    this.error = '';

    const { error } = await this.authService.signIn(this.email, this.password);
    
    if (error) {
      this.error = error.message;
      this.isLoading = false;
    } else {
      // Validate with backend
      this.http.get(`${environment.apiUrl}/users/me`).subscribe({
        next: (user) => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error = 'Failed to fetch user from backend: ' + err.message;
          this.isLoading = false;
        }
      });
    }
  }
}
