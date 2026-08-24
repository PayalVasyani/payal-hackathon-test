import { Module } from '@nestjs/common';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { PrismaService } from '../prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [LoadsController],
  providers: [LoadsService, PrismaService],
})
export class LoadsModule {}
