import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = exception.meta?.target as string[] | undefined;
        const fields = target?.join(', ') || 'field';
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: `A record with this ${fields} already exists.`,
          error: 'Conflict',
        });
        break;
      }
      case 'P2025': {
        // Record not found
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'Record not found.',
          error: 'Not Found',
        });
        break;
      }
      case 'P2003': {
        // Foreign key constraint violation
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'Invalid reference to related record.',
          error: 'Bad Request',
        });
        break;
      }
      case 'P2014': {
        // Required relation violation
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'The change would violate a required relation.',
          error: 'Bad Request',
        });
        break;
      }
      default:
        // Default 500 error
        super.catch(exception, host);
        break;
    }
  }
}
