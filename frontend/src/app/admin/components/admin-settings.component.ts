import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {
  activeTab: 'STAFF' | 'ROLES' = 'STAFF';

  staffList: any[] = [];
  rolesList: any[] = [];
  permissionsList: any[] = [];

  staffForm: FormGroup;
  roleForm: FormGroup;

  loading = true;
  savingStaff = false;
  savingRole = false;

  staffError = '';
  staffSuccess = '';
  roleError = '';
  roleSuccess = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.staffForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: ['', Validators.required]
    });

    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      permissions: [[]]
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    Promise.all([
      this.adminService.getStaff().toPromise(),
      this.adminService.getRoles().toPromise(),
      this.adminService.getPermissions().toPromise()
    ]).then(([staff, roles, perms]) => {
      this.staffList = staff || [];
      this.rolesList = roles || [];
      this.permissionsList = perms || [];
      this.loading = false;
    }).catch(err => {
      this.staffError = 'Failed to load initial data';
      this.loading = false;
    });
  }

  switchTab(tab: 'STAFF' | 'ROLES') {
    this.activeTab = tab;
    this.staffError = '';
    this.staffSuccess = '';
    this.roleError = '';
    this.roleSuccess = '';
  }

  onRolePermissionToggle(event: any, permissionId: string) {
    const current = this.roleForm.get('permissions')?.value as string[];
    if (event.target.checked) {
      this.roleForm.patchValue({ permissions: [...current, permissionId] });
    } else {
      this.roleForm.patchValue({ permissions: current.filter(id => id !== permissionId) });
    }
  }

  onCreateRole(): void {
    if (this.roleForm.invalid) return;
    this.savingRole = true;
    this.roleError = '';
    this.roleSuccess = '';

    const payload = {
      name: this.roleForm.value.name,
      permissionIds: this.roleForm.value.permissions
    };

    this.adminService.createRole(payload).subscribe({
      next: (role) => {
        this.roleSuccess = 'Role created successfully.';
        this.savingRole = false;
        this.roleForm.reset({ name: '', permissions: [] });
        this.fetchData();
      },
      error: (err) => {
        this.roleError = err.error?.message || 'Failed to create role.';
        this.savingRole = false;
      }
    });
  }

  onInviteStaff(): void {
    if (this.staffForm.invalid) return;
    this.savingStaff = true;
    this.staffError = '';
    this.staffSuccess = '';

    this.adminService.inviteStaff(this.staffForm.value).subscribe({
      next: () => {
        this.staffSuccess = 'Staff account created successfully! They can log in immediately.';
        this.savingStaff = false;
        this.staffForm.reset();
        this.fetchData();
      },
      error: (err) => {
        this.staffError = err.error?.message || 'Failed to invite staff.';
        this.savingStaff = false;
      }
    });
  }
}
