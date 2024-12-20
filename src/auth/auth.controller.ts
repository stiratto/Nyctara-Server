import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('/login')
  login(@Body() body) {
    return this.authService.signIn(body.password);
  }
}
