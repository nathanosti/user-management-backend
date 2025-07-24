import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = 400;

      switch (exception.code) {
        case 'P2002':
          message = `O valor informado já está em uso: ${(exception.meta?.target as string[]).join(', ')}`;
          break;
        case 'P2003':
          message = `Restrição de integridade violada. Verifique os relacionamentos.`;
          break;
        case 'P2025':
          message = `Registro solicitado não encontrado.`;
          break;
        default:
          message = 'Erro de banco de dados.';
      }
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = 500;
      message = 'Erro desconhecido ao acessar o banco de dados.';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = 400;
      message = 'Erro de validação nos dados enviados.';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = 500;
      message = 'Falha ao conectar ao banco de dados.';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
