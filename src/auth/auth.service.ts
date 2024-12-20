import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) { }
  async signIn(password: any): Promise<{ access_token: string }> {
    try {
      if (password !== this.configService.get<string>('secret_password')) {
        throw new UnauthorizedException('Wrong password');
      }

      const payload = { username: 'admin', role: 'admin' };

      return {
        access_token: await this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('jwt_secret'),
          expiresIn: "2 days",
        }),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error)
    }
  }
}
