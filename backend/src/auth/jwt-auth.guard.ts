import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info) {
        this.logger.error(`JWT Validation failed: ${info.message || info}`);
      } else {
        this.logger.error(`JWT Validation failed: Missing or invalid token`);
      }
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
