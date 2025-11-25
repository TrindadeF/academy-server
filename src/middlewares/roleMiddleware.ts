import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import { AppError } from '@/utils/helpers';
import { AuthenticatedRequest } from '@/types';

export function roleMiddleware(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest;

    if (!authRequest.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!allowedRoles.includes(authRequest.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
  };
}
