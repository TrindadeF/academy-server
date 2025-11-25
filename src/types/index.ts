import { FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
  tenantId: string;
}

export interface TenantRequest extends FastifyRequest {
  tenantId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
