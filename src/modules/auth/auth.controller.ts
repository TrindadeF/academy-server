import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { TenantRequest, AuthenticatedRequest } from '@/types';
import { tenantMiddleware } from '@/middlewares/tenantMiddleware';
import { authMiddleware } from '@/middlewares/authMiddleware';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify);

  // Register
  fastify.post(
    '/register',
    {
      preHandler: [tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request as TenantRequest).tenantId;
        const body = registerSchema.parse(request.body);

        const user = await authService.register(tenantId, body);

        return sendSuccess(reply, user, 201);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Registration failed',
          error.statusCode || 400,
        );
      }
    },
  );

  // Login
  fastify.post(
    '/login',
    {
      preHandler: [tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request as TenantRequest).tenantId;
        const body = loginSchema.parse(request.body);

        const result = await authService.login(tenantId, body);

        // Set cookies
        reply
          .setCookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
          })
          .setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });

        return sendSuccess(reply, result);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Login failed',
          error.statusCode || 400,
        );
      }
    },
  );

  // Refresh Token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Tentar obter refresh token do cookie ou do body
      let refreshToken = request.cookies.refreshToken;

      if (!refreshToken) {
        const body = refreshTokenSchema.parse(request.body);
        refreshToken = body.refreshToken;
      }

      if (!refreshToken) {
        return sendError(reply, 'Refresh token not provided', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      // Set new access token cookie
      reply.setCookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
      });

      return sendSuccess(reply, result);
    } catch (error: any) {
      return sendError(
        reply,
        error.message || 'Token refresh failed',
        error.statusCode || 400,
      );
    }
  });

  // Logout
  fastify.post(
    '/logout',
    {
      preHandler: [authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const refreshToken = request.cookies.refreshToken;

        if (refreshToken) {
          await authService.logout(refreshToken);
        }

        // Clear cookies
        reply.clearCookie('accessToken').clearCookie('refreshToken');

        return sendSuccess(reply, { message: 'Logged out successfully' });
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Logout failed',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get current user
  fastify.get(
    '/me',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;

        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            profile: true,
            company: true,
          },
        });

        if (!user) {
          return sendError(reply, 'User not found', 404);
        }

        return sendSuccess(reply, user);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to get user',
          error.statusCode || 400,
        );
      }
    },
  );
}
