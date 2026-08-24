import { Controller, Get, Req, UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.usersService.findBySupabaseId(userId);

    if (!user) {
      const logger = new Logger('UsersController');
      logger.warn(`Authenticated Supabase user ${userId} not found in application database.`);
      throw new UnauthorizedException('User profile not found in application database.');
    }

    return user;
  }
}
