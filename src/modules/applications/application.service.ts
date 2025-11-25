import { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/helpers';
import { CreateApplicationInput, UpdateApplicationStatusInput } from './application.schema';

export class ApplicationService {
  constructor(private fastify: FastifyInstance) {}

  async applyToJob(userId: string, data: CreateApplicationInput) {
    // Verificar se o usuário é estudante
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'student') {
      throw new AppError('Only students can apply to jobs', 403);
    }

    // Verificar se a vaga existe e está no mesmo tenant
    const job = await this.fastify.prisma.job.findFirst({
      where: {
        id: data.jobId,
        tenantId: user.tenantId,
        isActive: true,
      },
    });

    if (!job) {
      throw new AppError('Job not found or not active', 404);
    }

    // Verificar se já aplicou para esta vaga
    const existingApplication = await this.fastify.prisma.application.findUnique({
      where: {
        jobId_userId: {
          jobId: data.jobId,
          userId,
        },
      },
    });

    if (existingApplication) {
      throw new AppError('You have already applied to this job', 400);
    }

    // Criar aplicação
    const application = await this.fastify.prisma.application.create({
      data: {
        jobId: data.jobId,
        userId,
      },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return application;
  }

  async getApplicationsByStudent(userId: string) {
    const applications = await this.fastify.prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                website: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  async getApplicationsByJob(jobId: string, userId: string, tenantId: string) {
    // Verificar se o usuário é dono da empresa que criou a vaga
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    const job = await this.fastify.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
        tenantId,
      },
    });

    if (!job) {
      throw new AppError('Job not found or you do not have permission to view applications', 404);
    }

    const applications = await this.fastify.prisma.application.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  async getApplicationsByCompany(userId: string, tenantId: string) {
    // Verificar se o usuário tem uma empresa
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    const applications = await this.fastify.prisma.application.findMany({
      where: {
        job: {
          companyId: company.id,
          tenantId,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    tenantId: string,
    data: UpdateApplicationStatusInput,
  ) {
    // Verificar se o usuário é dono da empresa
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    // Verificar se a aplicação pertence a uma vaga da empresa
    const application = await this.fastify.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.job.companyId !== company.id) {
      throw new AppError('You do not have permission to update this application', 403);
    }

    if (application.job.tenantId !== tenantId) {
      throw new AppError('Application not found in this tenant', 404);
    }

    // Atualizar status
    const updatedApplication = await this.fastify.prisma.application.update({
      where: { id: applicationId },
      data: { status: data.status },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedApplication;
  }

  async deleteApplication(applicationId: string, userId: string) {
    // Verificar se a aplicação pertence ao usuário
    const application = await this.fastify.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.userId !== userId) {
      throw new AppError('You do not have permission to delete this application', 403);
    }

    await this.fastify.prisma.application.delete({
      where: { id: applicationId },
    });

    return { message: 'Application deleted successfully' };
  }
}
