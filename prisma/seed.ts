import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar tenant de exemplo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ufabc' },
    update: {},
    create: {
      name: 'Universidade Federal do ABC',
      slug: 'ufabc',
      domain: 'ufabc.academy.com',
    },
  });

  console.log('✅ Tenant created:', tenant.slug);

  // Criar admin global
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@ufabc.edu.br'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin UFABC',
      email: 'admin@ufabc.edu.br',
      password: hashedPassword,
      role: 'tenantAdmin',
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Criar estudante de exemplo
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'joao@aluno.ufabc.edu.br'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'João Silva',
      email: 'joao@aluno.ufabc.edu.br',
      password: studentPassword,
      role: 'student',
      profile: {
        create: {
          course: 'Ciência da Computação',
          semester: 6,
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          bio: 'Estudante de Ciência da Computação apaixonado por tecnologia.',
        },
      },
    },
  });

  console.log('✅ Student created:', student.email);

  // Criar empresa de exemplo
  const companyPassword = await bcrypt.hash('company123', 10);
  const companyUser = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'contato@techcorp.com'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Tech Corp Admin',
      email: 'contato@techcorp.com',
      password: companyPassword,
      role: 'company',
      company: {
        create: {
          tenantId: tenant.id,
          name: 'Tech Corp',
          description: 'Empresa de tecnologia focada em soluções inovadoras.',
          website: 'https://techcorp.com',
        },
      },
    },
    include: {
      company: true,
    },
  });

  console.log('✅ Company created:', companyUser.company?.name);

  // Criar vaga de exemplo
  if (companyUser.company) {
    const job = await prisma.job.create({
      data: {
        tenantId: tenant.id,
        companyId: companyUser.company.id,
        title: 'Desenvolvedor Full Stack Júnior',
        description: 'Buscamos desenvolvedor full stack para integrar nossa equipe.',
        requirements: [
          'JavaScript/TypeScript',
          'React',
          'Node.js',
          'Git',
          'Inglês intermediário',
        ],
      },
    });

    console.log('✅ Job created:', job.title);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
