import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('/api/auth')
export class AuthController {

  constructor(private readonly authService: AuthService) { }
  @Post('/login')
  login(@Body() body: CreateAuthDto) {
    return this.authService.signIn(body.password);
  }
}
