import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TenantService } from './tenant.service';
import { createTenantSchema, updateTenantSchema } from './tenant.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { roleMiddleware } from '@/middlewares/roleMiddleware';

export async function tenantRoutes(fastify: FastifyInstance) {
  const tenantService = new TenantService(fastify);

  // Create tenant (only globalAdmin)
  fastify.post(
    '/',
    {
      preHandler: [authMiddleware, roleMiddleware(['globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createTenantSchema.parse(request.body);
        const tenant = await tenantService.createTenant(body);

        return sendSuccess(reply, tenant, 201);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to create tenant',
          error.statusCode || 400,
        );
      }
    },
  );

  // List all tenants (only globalAdmin)
  fastify.get(
    '/',
    {
      preHandler: [authMiddleware, roleMiddleware(['globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenants = await tenantService.getTenants();
        return sendSuccess(reply, tenants);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch tenants',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get tenant by ID (globalAdmin or tenantAdmin of that tenant)
  fastify.get(
    '/:id',
    {
      preHandler: [authMiddleware, roleMiddleware(['globalAdmin', 'tenantAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const tenant = await tenantService.getTenantById(id);

        return sendSuccess(reply, tenant);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch tenant',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update tenant (only globalAdmin)
  fastify.put(
    '/:id',
    {
      preHandler: [authMiddleware, roleMiddleware(['globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateTenantSchema.parse(request.body);

        const tenant = await tenantService.updateTenant(id, body);

        return sendSuccess(reply, tenant);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update tenant',
          error.statusCode || 400,
        );
      }
    },
  );

  // Delete tenant (only globalAdmin)
  fastify.delete(
    '/:id',
    {
      preHandler: [authMiddleware, roleMiddleware(['globalAdmin'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await tenantService.deleteTenant(id);

        return sendSuccess(reply, result);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to delete tenant',
          error.statusCode || 400,
        );
      }
    },
  );
}
