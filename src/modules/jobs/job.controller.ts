import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JobService } from './job.service';
import { createJobSchema, updateJobSchema } from './job.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { tenantMiddleware } from '@/middlewares/tenantMiddleware';
import { roleMiddleware } from '@/middlewares/roleMiddleware';
import { AuthenticatedRequest, TenantRequest } from '@/types';

export async function jobRoutes(fastify: FastifyInstance) {
  const jobService = new JobService(fastify);

  // Create job (company only)
  fastify.post(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId, tenantId } = (request as AuthenticatedRequest).user;
        const body = createJobSchema.parse(request.body);

        const job = await jobService.createJob(userId, tenantId, body);

        return sendSuccess(reply, job, 201);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to create job',
          error.statusCode || 400,
        );
      }
    },
  );

  // List all jobs in tenant
  fastify.get(
    '/',
    {
      preHandler: [tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantId = (request as TenantRequest).tenantId;
        const { isActive } = request.query as { isActive?: string };

        const jobs = await jobService.listJobs(
          tenantId,
          isActive !== undefined ? isActive === 'true' : undefined,
        );

        return sendSuccess(reply, jobs);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch jobs',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get job by ID
  fastify.get(
    '/:id',
    {
      preHandler: [tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as TenantRequest).tenantId;

        const job = await jobService.getJobById(id, tenantId);

        return sendSuccess(reply, job);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch job',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get jobs by company
  fastify.get(
    '/company/:companyId',
    {
      preHandler: [tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { companyId } = request.params as { companyId: string };
        const tenantId = (request as TenantRequest).tenantId;

        const jobs = await jobService.getJobsByCompany(companyId, tenantId);

        return sendSuccess(reply, jobs);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch jobs',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update job (company only)
  fastify.put(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId, tenantId } = (request as AuthenticatedRequest).user;
        const body = updateJobSchema.parse(request.body);

        const job = await jobService.updateJob(id, userId, tenantId, body);

        return sendSuccess(reply, job);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update job',
          error.statusCode || 400,
        );
      }
    },
  );

  // Delete job (company only)
  fastify.delete(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId, tenantId } = (request as AuthenticatedRequest).user;

        const result = await jobService.deleteJob(id, userId, tenantId);

        return sendSuccess(reply, result);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to delete job',
          error.statusCode || 400,
        );
      }
    },
  );
}
