import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Auth Service Integration Tests', () => {
  let testTenantId: string;

  beforeAll(async () => {
    // Criar tenant de teste
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test University',
        slug: 'test-uni',
      },
    });
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.refreshToken.deleteMany({
      where: { tenantId: testTenantId },
    });
    await prisma.application.deleteMany({
      where: { user: { tenantId: testTenantId } },
    });
    await prisma.job.deleteMany({
      where: { tenantId: testTenantId },
    });
    await prisma.company.deleteMany({
      where: { tenantId: testTenantId },
    });
    await prisma.profile.deleteMany({
      where: { user: { tenantId: testTenantId } },
    });
    await prisma.user.deleteMany({
      where: { tenantId: testTenantId },
    });
    await prisma.tenant.delete({
      where: { id: testTenantId },
    });

    await prisma.$disconnect();
  });

  it('should create a new student user', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
      data: {
        tenantId: testTenantId,
        name: 'Test Student',
        email: 'student@test.com',
        password: hashedPassword,
        role: 'student',
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('student@test.com');
    expect(user.role).toBe('student');
  });

  it('should create a profile for student', async () => {
    const user = await prisma.user.findFirst({
      where: {
        email: 'student@test.com',
        tenantId: testTenantId,
      },
    });

    expect(user).toBeDefined();

    const profile = await prisma.profile.create({
      data: {
        userId: user!.id,
        course: 'Computer Science',
        semester: 5,
        skills: ['JavaScript', 'TypeScript'],
      },
    });

    expect(profile).toBeDefined();
    expect(profile.course).toBe('Computer Science');
  });

  it('should verify password correctly', async () => {
    const user = await prisma.user.findFirst({
      where: {
        email: 'student@test.com',
        tenantId: testTenantId,
      },
    });

    expect(user).toBeDefined();

    const isValid = await bcrypt.compare('password123', user!.password);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('wrongpassword', user!.password);
    expect(isInvalid).toBe(false);
  });
});
