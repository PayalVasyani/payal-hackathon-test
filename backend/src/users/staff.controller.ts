import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { createClient } from '@supabase/supabase-js';

@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {
  private supabase: any;

  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Staff invitations will not work.');
    }
  }

  private getOrgId(user: any): string {
    const membership = user.memberships?.[0];
    if (!membership) throw new ForbiddenException('User is not associated with any organization');
    return membership.organizationId;
  }

  @Get()
  @RequirePermissions('staff.manage')
  async getStaff(@Req() req: any) {
    const orgId = this.getOrgId(req.appUser);
    return this.prisma.user.findMany({
      where: {
        memberships: {
          some: { organizationId: orgId }
        }
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });
  }

  @Post('invite')
  @RequirePermissions('staff.manage')
  async inviteStaff(@Body() dto: InviteStaffDto, @Req() req: any) {
    const orgId = this.getOrgId(req.appUser);
    
    // Validate role belongs to this org
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role || role.organizationId !== orgId) {
      throw new ForbiddenException('Invalid role specified');
    }

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('User already exists in the system');
    }

    if (!this.supabase) {
      throw new InternalServerErrorException('Supabase Admin client not initialized (missing keys).');
    }

    // 1. Create User via Supabase Admin API directly with password
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true // auto confirm so they can login immediately
    });
    
    if (authError || !authData.user) {
      throw new InternalServerErrorException(`Supabase user creation failed: ${authError?.message}`);
    }

    // 2. Create the User in local DB mapped to Supabase ID
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: authData.user.id,
          email: dto.email,
          name: dto.name,
          accountType: req.appUser.accountType, // Inherit account type (BROKER or CARRIER)
        }
      });

      // Assign to Organization
      await tx.organizationMembership.create({
        data: {
          userId: newUser.id,
          organizationId: orgId
        }
      });

      // Assign the Role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: role.id
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: 'User',
          entityId: newUser.id,
          action: 'INVITED_STAFF',
          userId: req.appUser.id,
          newState: { email: dto.email, roleId: role.id } as any
        }
      });

      return { message: 'Invitation sent via Supabase successfully.', user: newUser };
    });
  }
}
