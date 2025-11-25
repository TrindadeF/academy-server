import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CompanyService } from './company.service';
import { createCompanySchema, updateCompanySchema } from './company.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { tenantMiddleware } from '@/middlewares/tenantMiddleware';
import { roleMiddleware } from '@/middlewares/roleMiddleware';
import { AuthenticatedRequest, TenantRequest } from '@/types';

export async function companyRoutes(fastify: FastifyInstance) {
  const companyService = new CompanyService(fastify);

  // Create company
  fastify.post(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId, tenantId } = (request as AuthenticatedRequest).user;
        const body = createCompanySchema.parse(request.body);

        const company = await companyService.createCompany(userId, tenantId, body);

        return sendSuccess(reply, company, 201);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to create company',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get current user's company
  fastify.get(
    '/me',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const company = await companyService.getCompanyByUserId(userId);

        return sendSuccess(reply, company);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch company',
          error.statusCode || 400,
        );
      }
    },
  );

  // List all companies in tenant
  fastify.get(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request as TenantRequest).tenantId;
        const companies = await companyService.listCompanies(tenantId);

        return sendSuccess(reply, companies);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch companies',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get company by ID
  fastify.get(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as TenantRequest).tenantId;

        const company = await companyService.getCompanyById(id, tenantId);

        return sendSuccess(reply, company);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch company',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update company
  fastify.put(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const body = updateCompanySchema.parse(request.body);

        const company = await companyService.updateCompany(userId, body);

        return sendSuccess(reply, company);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update company',
          error.statusCode || 400,
        );
      }
    },
  );

  // Delete company
  fastify.delete(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const result = await companyService.deleteCompany(userId);

        return sendSuccess(reply, result);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to delete company',
          error.statusCode || 400,
        );
      }
    },
  );
}
