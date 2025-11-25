import { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function prismaPlugin(fastify: FastifyInstance) {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fastifyPlugin(prismaPlugin);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
