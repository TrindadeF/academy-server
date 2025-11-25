import { FastifyReply } from 'fastify';
import { ApiResponse } from '@/types';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
  };
}

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode: number = 200) {
  return reply.status(statusCode).send(successResponse(data));
}

export function sendError(reply: FastifyReply, error: string, statusCode: number = 400) {
  return reply.status(statusCode).send(errorResponse(error));
}

export function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Remove port if present
  const hostWithoutPort = host.split(':')[0];

  // Split by dots
  const parts = hostWithoutPort.split('.');

  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    return parts[0];
  }

  // For localhost development, we can use the format: tenant.localhost
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  return null;
}

export function calculatePagination(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export function generatePaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
