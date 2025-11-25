import { FastifyInstance } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';
import fastifyJWT from '@fastify/jwt';
import { env } from '@/config/env';

async function authPlugin(fastify: FastifyInstance) {
  fastify.register(fastifyJWT, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Decorator para criar refresh token JWT
  fastify.decorate('createRefreshToken', (payload: any) => {
    return fastify.jwt.sign(payload, {
      secret: env.REFRESH_TOKEN_SECRET,
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });
  });

  // Decorator para verificar refresh token
  fastify.decorate('verifyRefreshToken', async (token: string) => {
    return fastify.jwt.verify(token, {
      secret: env.REFRESH_TOKEN_SECRET,
    });
  });
}

export default fastifyPlugin(authPlugin);

declare module 'fastify' {
  interface FastifyInstance {
    createRefreshToken: (payload: any) => string;
    verifyRefreshToken: (token: string) => Promise<any>;
  }
}
