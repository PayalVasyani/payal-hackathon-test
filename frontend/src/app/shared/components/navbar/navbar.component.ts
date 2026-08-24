import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  userEmail: string = '';
  userOrganization: string = '';

  constructor(
    public authService: AuthService,
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.appUser$.subscribe(user => {
      if (user) {
        this.userEmail = user.email;
        this.userOrganization = user.memberships?.[0]?.organization?.name || '';
      }
    });
  }

  logout(): void {
    this.authService.signOut().then(() => {
      this.userService.clearUser();
      this.router.navigate(['/login']);
    });
  }
}
