import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    if (!user || !user.userId) {
      throw new ForbiddenException('User is not authenticated.');
    }

    const appUser = await this.usersService.findBySupabaseId(user.userId);
    
    if (!appUser) {
      throw new ForbiddenException('Application user not found.');
    }

    // Attach appUser to request for easy access in controllers/services
    request.appUser = appUser;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Extract all permissions from all roles the user has
    const userPermissions = new Set<string>();
    
    for (const userRole of appUser.roles) {
      if (userRole.role && userRole.role.permissions) {
        for (const rolePerm of userRole.role.permissions) {
          if (rolePerm.permission) {
            userPermissions.add(rolePerm.permission.code);
          }
        }
      }
    }
    if (appUser.accountType === 'SHIPPER') {
      userPermissions.add('load.read');
    }

    const hasPermission = requiredPermissions.every((permission) => userPermissions.has(permission));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    return true;
  }
}
