import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { AppError } from '@/utils/helpers';
import { RegisterInput, LoginInput } from './auth.schema';
import { JWTPayload } from '@/types';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(tenantId: string, data: RegisterInput) {
    // Verificar se o email já existe no tenant
    const existingUser = await this.fastify.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: data.email,
        },
      },
    });

    if (existingUser) {
      throw new AppError('Email already registered in this tenant', 400);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await this.fastify.prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Se for estudante, criar perfil
    if (data.role === 'student') {
      await this.fastify.prisma.profile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  }

  async login(tenantId: string, data: LoginInput) {
    // Buscar usuário
    const user = await this.fastify.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: data.email,
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('User is not active', 403);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Criar payload JWT
    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    // Gerar tokens
    const accessToken = this.fastify.jwt.sign(payload);
    const refreshToken = this.fastify.createRefreshToken(payload);

    // Calcular data de expiração do refresh token (7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Salvar refresh token no banco
    await this.fastify.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        tenantId: user.tenantId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenString: string) {
    // Verificar se o refresh token existe no banco
    const storedToken = await this.fastify.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Verificar se o token não expirou
    if (storedToken.expiresAt < new Date()) {
      // Deletar token expirado
      await this.fastify.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError('Refresh token expired', 401);
    }

    // Verificar se o usuário está ativo
    if (!storedToken.user.isActive) {
      throw new AppError('User is not active', 403);
    }

    // Verificar JWT
    try {
      await this.fastify.verifyRefreshToken(refreshTokenString);
    } catch (error) {
      // Deletar token inválido
      await this.fastify.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError('Invalid refresh token', 401);
    }

    // Criar novo payload
    const payload: JWTPayload = {
      userId: storedToken.user.id,
      tenantId: storedToken.user.tenantId,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    // Gerar novo access token
    const newAccessToken = this.fastify.jwt.sign(payload);

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(refreshTokenString: string) {
    // Deletar refresh token do banco
    await this.fastify.prisma.refreshToken.deleteMany({
      where: { token: refreshTokenString },
    });

    return { message: 'Logged out successfully' };
  }
}
