import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/errors.log' }),
    new winston.transports.Console(),
  ],
});

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
  exception instanceof HttpException
    ? exception.getResponse()
    : 'Internal server error';

// getResponse() renvoie parfois une string simple, parfois un objet
// { statusCode, message, error } (cas des exceptions standard comme UnauthorizedException).
// On normalise pour toujours renvoyer une chaîne simple au client.
const message =
  typeof rawMessage === 'string'
    ? rawMessage
    : ((rawMessage as any)?.message ?? 'Une erreur est survenue');

    // Ne logge en détail que les vraies erreurs serveur (500), pas les 400/401/403/404 normaux
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.error({
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}