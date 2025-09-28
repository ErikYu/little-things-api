import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

export class CustomizeHttpException extends HttpException {
  constructor(
    public code: number,
    message: string,
    status: HttpStatus,
  ) {
    super(message, status);
  }
}
