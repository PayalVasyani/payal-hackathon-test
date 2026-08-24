import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto, AccountType } from './dto/register.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: any;

  // The permissions granted to the default Admin role created for new Broker/Carrier organizations.
  private readonly brokerAdminPermissions = [
    'load.read', 'load.create', 'load.assign_carrier',
    'load.override_compliance_flag', 'load.update_status',
    'rate.create', 'staff.manage'
  ];

  private readonly carrierAdminPermissions = [
    'load.read', 'rate.confirm', 'pod.upload', 'load.update_status', 'staff.manage'
  ];

  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Registration will not work.');
    }
  }

  async register(dto: RegisterDto) {
    if (!this.supabase) {
      throw new InternalServerErrorException('Supabase Admin client not initialized.');
    }

    if ((dto.accountType === AccountType.BROKER || dto.accountType === AccountType.CARRIER) && !dto.companyName) {
      throw new BadRequestException('Company Name is required for Broker and Carrier accounts.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('User already exists in the system');
    }

    // 1. Create User via Supabase Admin API
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true // auto confirm so they can login immediately
    });

    if (authError || !authData.user) {
      throw new InternalServerErrorException(`Supabase user creation failed: ${authError?.message}`);
    }

    // 2. Bootstrap application data
    return this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          id: authData.user.id,
          email: dto.email,
          name: dto.name,
          accountType: dto.accountType,
        }
      });

      // If SHIPPER, we are done
      if (dto.accountType === AccountType.SHIPPER) {
        return { message: 'Registration successful', user: newUser };
      }

      // If BROKER or CARRIER, set up the org and admin role
      const newOrg = await tx.organization.create({
        data: {
          name: dto.companyName!,
          type: dto.accountType,
        }
      });

      await tx.organizationMembership.create({
        data: {
          userId: newUser.id,
          organizationId: newOrg.id
        }
      });

      // Create Admin Role
      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          organizationId: newOrg.id
        }
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: adminRole.id
        }
      });

      // Assign permissions to the new Admin role
      const allPermissions = await tx.permission.findMany();
      const requiredPerms = dto.accountType === AccountType.BROKER ? this.brokerAdminPermissions : this.carrierAdminPermissions;

      for (const code of requiredPerms) {
        const perm = allPermissions.find(p => p.code === code);
        if (perm) {
          await tx.rolePermission.create({
            data: { roleId: adminRole.id, permissionId: perm.id },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          entityType: 'User',
          entityId: newUser.id,
          action: 'REGISTERED_NEW_ORGANIZATION',
          userId: newUser.id,
          newState: { orgName: dto.companyName, orgId: newOrg.id } as any
        }
      });

      return { message: 'Registration successful and organization created.', user: newUser };
    });
  }
}
