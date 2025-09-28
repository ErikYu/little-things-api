import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { ApiResponse } from '../interfaces/api-response.interface';
import { CustomizeHttpException } from './customize-http-exception';

interface Response {
  status: (code: number) => Response;
  json: (data: ApiResponse) => void;
}

/**
 * 处理HTTP异常，将异常信息包装成ApiResponse格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let msg: string | string[] = 'Internal server error';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    let code = 0;

    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();
      status = HttpStatus.BAD_REQUEST;
      if (typeof response === 'object' && 'message' in response) {
        msg = response.message as string[];
      }
    } else if (exception instanceof CustomizeHttpException) {
      status = exception.getStatus();
      msg = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      msg = exception.message;
      status = exception.getStatus();
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      msg = exception.message || msg;
      this.logger.error(
        {
          stack: exception.stack,
          message: exception.message,
        },
        'INTERNAL_SERVER_ERROR',
      );
    }

    const errorResponse: ApiResponse = {
      success: false,
      msg,
      data: null,
    };

    if (code) {
      errorResponse.code = code;
    }

    response.status(status).json(errorResponse);
  }
}
