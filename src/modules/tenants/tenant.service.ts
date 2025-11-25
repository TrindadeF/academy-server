import { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/helpers';
import { CreateTenantInput, UpdateTenantInput } from './tenant.schema';

export class TenantService {
  constructor(private fastify: FastifyInstance) {}

  async createTenant(data: CreateTenantInput) {
    // Verificar se o slug já existe
    const existingTenant = await this.fastify.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existingTenant) {
      throw new AppError('Slug already in use', 400);
    }

    const tenant = await this.fastify.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain,
      },
    });

    return tenant;
  }

  async getTenants() {
    const tenants = await this.fastify.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            companies: true,
            jobs: true,
          },
        },
      },
    });

    return tenants;
  }

  async getTenantById(id: string) {
    const tenant = await this.fastify.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            companies: true,
            jobs: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    return tenant;
  }

  async updateTenant(id: string, data: UpdateTenantInput) {
    const tenant = await this.fastify.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const updatedTenant = await this.fastify.prisma.tenant.update({
      where: { id },
      data,
    });

    return updatedTenant;
  }

  async deleteTenant(id: string) {
    const tenant = await this.fastify.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    await this.fastify.prisma.tenant.delete({
      where: { id },
    });

    return { message: 'Tenant deleted successfully' };
  }
}
