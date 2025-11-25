import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './user.service';
import { updateProfileSchema, updateUserSchema } from './user.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { tenantMiddleware } from '@/middlewares/tenantMiddleware';
import { roleMiddleware } from '@/middlewares/roleMiddleware';
import { AuthenticatedRequest, TenantRequest } from '@/types';

export async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify);

  // Get current user profile
  fastify.get(
    '/profile',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const profile = await userService.getUserProfile(userId);

        return sendSuccess(reply, profile);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch profile',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update current user profile (for students)
  fastify.put(
    '/profile',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const body = updateProfileSchema.parse(request.body);

        const profile = await userService.updateProfile(userId, body);

        return sendSuccess(reply, profile);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update profile',
          error.statusCode || 400,
        );
      }
    },
  );

  // List users in tenant (admin only)
  fastify.get(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['tenantAdmin', 'globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request as TenantRequest).tenantId;
        const { role } = request.query as { role?: string };

        const users = await userService.listUsers(tenantId, role);

        return sendSuccess(reply, users);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch users',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get user by ID
  fastify.get(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = (request as AuthenticatedRequest).user;

        const user = await userService.getUserById(id, userId);

        return sendSuccess(reply, user);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch user',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update user (admin only)
  fastify.put(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['tenantAdmin', 'globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateUserSchema.parse(request.body);

        const user = await userService.updateUser(id, body);

        return sendSuccess(reply, user);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update user',
          error.statusCode || 400,
        );
      }
    },
  );
}
