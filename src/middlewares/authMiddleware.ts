import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '@/utils/helpers';
import { JWTPayload } from '@/types';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Tentar obter token do cookie ou do header Authorization
    let token = request.cookies.accessToken;

    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verificar e decodificar o token
    const decoded = await request.jwtVerify<JWTPayload>({
      onlyCookie: false,
    });

    // Verificar se o usuário existe e está ativo
    const user = await request.server.prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Anexar user à request
    (request as any).user = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    // Verificar se o tenantId do token corresponde ao tenant da request
    const requestTenantId = (request as any).tenantId;
    if (requestTenantId && user.tenantId !== requestTenantId) {
      throw new AppError('Tenant mismatch', 403);
    }
  } catch (error: any) {
    if (error.name === 'AppError') {
      throw error;
    }
    throw new AppError('Invalid token', 401);
  }
}
