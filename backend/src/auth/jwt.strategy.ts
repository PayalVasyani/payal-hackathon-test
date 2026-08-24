import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  private jwksCache: any = null;
  private jwksCacheTime: number = 0;

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

        if (header.alg === 'RS256') {
          return jwksProvider(request, rawJwtToken, done);
        } else if (header.alg === 'ES256') {
          const now = Date.now();
          if (this.jwksCache && (now - this.jwksCacheTime < 300000)) {
            this.processES256Key(this.jwksCache, header, done);
          } else {
            fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
              .then(res => res.json())
              .then(jwks => {
                console.log('Fetched JWKS from URL:', `${supabaseUrl}/auth/v1/.well-known/jwks.json`);
                console.log('Available KIDs in JWKS:', jwks.keys.map((k: any) => k.kid));
                console.log('Token header KID:', header.kid);
                this.jwksCache = jwks;
                this.jwksCacheTime = now;
                this.processES256Key(jwks, header, done);
              })
              .catch(err => done(err, undefined));
          }
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

  private processES256Key(jwks: any, header: any, done: any) {
    try {
      const key = jwks.keys.find((k: any) => k.kid === header.kid);
      if (!key) return done(new Error('Key not found in JWKS'), undefined);
      const { createPublicKey } = require('crypto');
      const pem = createPublicKey({ key, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
      done(null, pem);
    } catch (err) {
      done(err, undefined);
    }
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
