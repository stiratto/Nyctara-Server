import {
  Controller,
  Post,
  Body,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Controller()
export class AuthController {
  @Post('/login')
  login(@Body() body: { password: string }, @Res() res: Response) {
    const { password } = body;
    if (password !== process.env.SECRET_PASSWORD) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    res.status(200).send('Coincide');
  }
}
