import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';

// Plugins
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';

// Routes
import { authRoutes } from './modules/auth/auth.controller';
import { tenantRoutes } from './modules/tenants/tenant.controller';
import { userRoutes } from './modules/users/user.controller';
import { companyRoutes } from './modules/companies/company.controller';
import { jobRoutes } from './modules/jobs/job.controller';
import { applicationRoutes } from './modules/applications/application.controller';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  fastify.log.error(error);

  return reply.status(statusCode).send({
    success: false,
    error: error.message || 'Internal server error',
  });
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true, // Em produção, configure domínios específicos
    credentials: true,
  });

  // Cookies
  await fastify.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {},
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Custom plugins
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  });

  // API routes
  fastify.register(
    async (instance) => {
      instance.register(authRoutes, { prefix: '/auth' });
      instance.register(tenantRoutes, { prefix: '/tenants' });
      instance.register(userRoutes, { prefix: '/users' });
      instance.register(companyRoutes, { prefix: '/companies' });
      instance.register(jobRoutes, { prefix: '/jobs' });
      instance.register(applicationRoutes, { prefix: '/applications' });
    },
    { prefix: '/api' },
  );

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Route not found',
    });
  });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await fastify.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    fastify.log.info(`Server running on port ${env.PORT}`);
    fastify.log.info(`Environment: ${env.NODE_ENV}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});

// Start the server
start();
