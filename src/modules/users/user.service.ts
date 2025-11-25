import { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/helpers';
import { UpdateProfileInput, UpdateUserInput } from './user.schema';

export class UserService {
  constructor(private fastify: FastifyInstance) {}

  async getUserProfile(userId: string) {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
        company: {
          include: {
            _count: {
              select: { jobs: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'student') {
      throw new AppError('Only students can update profile', 403);
    }

    // Separar dados do user e do profile
    const { name, ...profileData } = data;

    // Atualizar user se name foi fornecido
    if (name) {
      await this.fastify.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    // Atualizar profile
    let profile;
    if (user.profile) {
      profile = await this.fastify.prisma.profile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      profile = await this.fastify.prisma.profile.create({
        data: {
          userId,
          ...profileData,
        },
      });
    }

    // Retornar user atualizado com profile
    return this.getUserProfile(userId);
  }

  async listUsers(tenantId: string, role?: string) {
    const where: any = { tenantId };

    if (role) {
      where.role = role;
    }

    const users = await this.fastify.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async getUserById(userId: string, requestingUserId: string) {
    const user = await this.getUserProfile(userId);

    // Usuários podem ver apenas perfis do mesmo tenant
    const requestingUser = await this.fastify.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new AppError('Requesting user not found', 404);
    }

    // Verificar se estão no mesmo tenant
    const userDetails = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userDetails || userDetails.tenantId !== requestingUser.tenantId) {
      throw new AppError('User not found or not in the same tenant', 404);
    }

    return user;
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await this.fastify.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }
}
