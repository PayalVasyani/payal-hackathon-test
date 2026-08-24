import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private prisma: PrismaService) {}

  private getOrgId(user: any): string {
    const membership = user.memberships?.[0];
    if (!membership) throw new ForbiddenException('User is not associated with any organization');
    return membership.organizationId;
  }

  @Get()
  @RequirePermissions('staff.manage')
  async getRoles(@Req() req: any) {
    const orgId = this.getOrgId(req.appUser);
    return this.prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  @Get('permissions')
  @RequirePermissions('staff.manage')
  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  @Post()
  @RequirePermissions('staff.manage')
  async createRole(@Body() dto: CreateRoleDto, @Req() req: any) {
    const orgId = this.getOrgId(req.appUser);
    
    // Create Role and its RolePermission mappings in a transaction
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          organizationId: orgId,
        }
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map(pid => ({
            roleId: role.id,
            permissionId: pid
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: 'Role',
          entityId: role.id,
          action: 'CREATED',
          userId: req.appUser.id,
          newState: { name: dto.name, permissions: dto.permissionIds } as any
        }
      });

      return role;
    });
  }
}
