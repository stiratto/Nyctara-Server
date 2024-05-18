import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() body: {password: string}, @Res() res: Response, @Req() req: Request) {
    const {password} = body
    if ( password === process.env.SECRET_PASSWORD) {
      console.log('Coincide')
      res.status(200).send('Coincide')
    } else {
      console.log('No Coincide')

      res.status(404).send('No coincide')

    }
  }
}
