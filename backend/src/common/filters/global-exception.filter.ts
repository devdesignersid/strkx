import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'object' && responseBody !== null) {
        message = (responseBody as any).message || message;
        error = (responseBody as any).error || error;
      } else {
        message = responseBody as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma specific errors if needed, for now treat as 400 or 500 depending on code
      // P2002: Unique constraint failed
      // P2025: Record not found
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ');
        message = target
          ? `Unique constraint violation: ${target} already exists`
          : 'Unique constraint violation';
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        error = 'NotFound';
      }
    }

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (status >= 500) {
      this.logger.error(
        `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
