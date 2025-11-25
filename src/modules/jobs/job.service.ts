import { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/helpers';
import { CreateJobInput, UpdateJobInput } from './job.schema';

export class JobService {
  constructor(private fastify: FastifyInstance) {}

  async createJob(userId: string, tenantId: string, data: CreateJobInput) {
    // Verificar se o usuário tem uma empresa
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    // Criar vaga
    const job = await this.fastify.prisma.job.create({
      data: {
        tenantId,
        companyId: company.id,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
      },
    });

    return job;
  }

  async listJobs(tenantId: string, isActive?: boolean) {
    const where: any = { tenantId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const jobs = await this.fastify.prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs;
  }

  async getJobById(jobId: string, tenantId: string) {
    const job = await this.fastify.prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            website: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    return job;
  }

  async getJobsByCompany(companyId: string, tenantId: string) {
    const jobs = await this.fastify.prisma.job.findMany({
      where: {
        companyId,
        tenantId,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs;
  }

  async updateJob(jobId: string, userId: string, tenantId: string, data: UpdateJobInput) {
    // Verificar se o usuário tem uma empresa
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    // Verificar se a vaga pertence à empresa
    const job = await this.fastify.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
        tenantId,
      },
    });

    if (!job) {
      throw new AppError('Job not found or you do not have permission to update it', 404);
    }

    // Atualizar vaga
    const updatedJob = await this.fastify.prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return updatedJob;
  }

  async deleteJob(jobId: string, userId: string, tenantId: string) {
    // Verificar se o usuário tem uma empresa
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('User does not have a company', 403);
    }

    // Verificar se a vaga pertence à empresa
    const job = await this.fastify.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
        tenantId,
      },
    });

    if (!job) {
      throw new AppError('Job not found or you do not have permission to delete it', 404);
    }

    // Deletar vaga
    await this.fastify.prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Job deleted successfully' };
  }
}
