import { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/helpers';
import { CreateCompanyInput, UpdateCompanyInput } from './company.schema';

export class CompanyService {
  constructor(private fastify: FastifyInstance) {}

  async createCompany(userId: string, tenantId: string, data: CreateCompanyInput) {
    // Verificar se o usuário já tem uma empresa
    const existingCompany = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      throw new AppError('User already has a company', 400);
    }

    // Verificar se o usuário tem role 'company'
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Atualizar role do usuário para 'company' se necessário
    if (user.role !== 'company') {
      await this.fastify.prisma.user.update({
        where: { id: userId },
        data: { role: 'company' },
      });
    }

    // Criar empresa
    const company = await this.fastify.prisma.company.create({
      data: {
        tenantId,
        userId,
        name: data.name,
        description: data.description,
        website: data.website,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return company;
  }

  async getCompanyByUserId(userId: string) {
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  }

  async getCompanyById(companyId: string, tenantId: string) {
    const company = await this.fastify.prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  }

  async listCompanies(tenantId: string) {
    const companies = await this.fastify.prisma.company.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies;
  }

  async updateCompany(userId: string, data: UpdateCompanyInput) {
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const updatedCompany = await this.fastify.prisma.company.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
    });

    return updatedCompany;
  }

  async deleteCompany(userId: string) {
    const company = await this.fastify.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    await this.fastify.prisma.company.delete({
      where: { userId },
    });

    return { message: 'Company deleted successfully' };
  }
}
