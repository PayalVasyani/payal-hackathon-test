import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    
    // Create the JWKS provider
    const jwksProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    });

    super({
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // We need to parse the header to determine the algorithm
        const base64Header = rawJwtToken.split('.')[0];
        const header = JSON.parse(Buffer.from(base64Header, 'base64').toString());

        if (header.alg === 'RS256' || header.alg === 'ES256') {
          // Use JWKS for asymmetric algorithms
          return jwksProvider(request, rawJwtToken, done);
        } else if (header.alg === 'HS256') {
          // Fallback to symmetric secret for HS256
          if (!supabaseSecret) {
             return done(new Error('SUPABASE_JWT_SECRET is not configured for HS256 token verification'), undefined);
          }
          return done(null, supabaseSecret);
        } else {
           return done(new Error(`Unsupported JWT algorithm: ${header.alg}`), undefined);
        }
      },
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ['RS256', 'HS256', 'ES256'],
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      this.logger.error('JWT payload missing sub (user ID)');
      throw new UnauthorizedException('Invalid JWT payload');
    }
    
    // We pass the payload downstream
    return { userId: payload.sub, email: payload.email };
  }
}
