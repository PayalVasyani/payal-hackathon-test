import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { RolesController } from './roles.controller';
import { StaffController } from './staff.controller';

@Module({
  controllers: [UsersController, RolesController, StaffController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
