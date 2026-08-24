import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, PrismaService],
  exports: [JwtStrategy, PassportModule, AuthService],
})
export class AuthModule {}
