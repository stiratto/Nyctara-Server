import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomInternalServerErrorException extends HttpException {
  constructor(message: string, status: number) {
    super({ message, status }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
