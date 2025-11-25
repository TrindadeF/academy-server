import { FastifyRequest, FastifyReply } from 'fastify';
import { extractSubdomain } from '@/utils/helpers';
import { AppError } from '@/utils/helpers';

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const host = request.headers.host;

  if (!host) {
    throw new AppError('Host header is missing', 400);
  }

  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    throw new AppError('Tenant subdomain not found', 400);
  }

  // Buscar tenant no banco de dados
  const tenant = await request.server.prisma.tenant.findUnique({
    where: { slug: subdomain },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    throw new AppError('Tenant is not active', 403);
  }

  // Anexar tenantId à request
  (request as any).tenantId = tenant.id;
}
