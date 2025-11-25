import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationService } from './application.service';
import { createApplicationSchema, updateApplicationStatusSchema } from './application.schema';
import { sendSuccess, sendError } from '@/utils/helpers';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { tenantMiddleware } from '@/middlewares/tenantMiddleware';
import { roleMiddleware } from '@/middlewares/roleMiddleware';
import { AuthenticatedRequest } from '@/types';

export async function applicationRoutes(fastify: FastifyInstance) {
  const applicationService = new ApplicationService(fastify);

  // Apply to job (student only)
  fastify.post(
    '/',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['student'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const body = createApplicationSchema.parse(request.body);

        const application = await applicationService.applyToJob(userId, body);

        return sendSuccess(reply, application, 201);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to apply to job',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get current student's applications
  fastify.get(
    '/me',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['student'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = (request as AuthenticatedRequest).user;
        const applications = await applicationService.getApplicationsByStudent(userId);

        return sendSuccess(reply, applications);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch applications',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get applications for a specific job (company only)
  fastify.get(
    '/job/:jobId',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { jobId } = request.params as { jobId: string };
        const { userId, tenantId } = (request as AuthenticatedRequest).user;

        const applications = await applicationService.getApplicationsByJob(
          jobId,
          userId,
          tenantId,
        );

        return sendSuccess(reply, applications);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch applications',
          error.statusCode || 400,
        );
      }
    },
  );

  // Get all applications for company's jobs (company only)
  fastify.get(
    '/company/me',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId, tenantId } = (request as AuthenticatedRequest).user;
        const applications = await applicationService.getApplicationsByCompany(userId, tenantId);

        return sendSuccess(reply, applications);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to fetch applications',
          error.statusCode || 400,
        );
      }
    },
  );

  // Update application status (company only)
  fastify.patch(
    '/:id/status',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['company'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId, tenantId } = (request as AuthenticatedRequest).user;
        const body = updateApplicationStatusSchema.parse(request.body);

        const application = await applicationService.updateApplicationStatus(
          id,
          userId,
          tenantId,
          body,
        );

        return sendSuccess(reply, application);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to update application status',
          error.statusCode || 400,
        );
      }
    },
  );

  // Delete application (student only - withdraw application)
  fastify.delete(
    '/:id',
    {
      preHandler: [tenantMiddleware, authMiddleware, roleMiddleware(['student'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = (request as AuthenticatedRequest).user;

        const result = await applicationService.deleteApplication(id, userId);

        return sendSuccess(reply, result);
      } catch (error: any) {
        return sendError(
          reply,
          error.message || 'Failed to delete application',
          error.statusCode || 400,
        );
      }
    },
  );
}
