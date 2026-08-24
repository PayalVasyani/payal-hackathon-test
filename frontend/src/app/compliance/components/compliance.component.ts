import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComplianceService } from '../services/compliance.service';
import { UserService } from '../../core/services/user.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.css']
})
export class ComplianceComponent implements OnInit {
  complianceForm: FormGroup;
  loading = true;
  saving = false;
  error = '';
  success = '';

  availableEquipment = ['DRY_VAN', 'FLATBED', 'REEFER', 'STEP_DECK'];

  constructor(
    private fb: FormBuilder,
    private complianceService: ComplianceService,
    public userService: UserService
  ) {
    this.complianceForm = this.fb.group({
      insuranceExpiry: [''],
      mcDotStatus: ['ACTIVE'],
      approvedEquipment: [[]]
    });
  }

  ngOnInit(): void {
    this.fetchCompliance();
  }

  fetchCompliance(): void {
    this.complianceService.getMyCompliance().subscribe({
      next: (data) => {
        if (data) {
          const formattedDate = data.insuranceExpiry ? new Date(data.insuranceExpiry).toISOString().split('T')[0] : '';
          this.complianceForm.patchValue({
            insuranceExpiry: formattedDate,
            mcDotStatus: data.mcDotStatus || 'ACTIVE',
            approvedEquipment: data.approvedEquipment || []
          });
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load compliance details.';
        this.loading = false;
      }
    });
  }

  onEquipmentChange(event: any): void {
    const value = event.target.value;
    const isChecked = event.target.checked;
    
    const currentEquipment = this.complianceForm.get('approvedEquipment')?.value as string[];
    
    if (isChecked) {
      this.complianceForm.patchValue({ approvedEquipment: [...currentEquipment, value] });
    } else {
      this.complianceForm.patchValue({ approvedEquipment: currentEquipment.filter(e => e !== value) });
    }
  }

  onSubmit(): void {
    if (this.complianceForm.invalid) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      ...this.complianceForm.value,
      insuranceExpiry: this.complianceForm.value.insuranceExpiry ? new Date(this.complianceForm.value.insuranceExpiry).toISOString() : null
    };

    this.complianceService.updateMyCompliance(payload).subscribe({
      next: (data) => {
        this.success = 'Compliance records updated successfully.';
        this.saving = false;
      },
      error: (err) => {
        this.error = 'Failed to update compliance records.';
        this.saving = false;
      }
    });
  }
}
