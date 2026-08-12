import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(process.env.DATABASE_URL
      ? { datasources: { db: { url: process.env.DATABASE_URL } } }
      : {}),
  }).$extends({
    query: {
      $allModels: {
        async create({ model, operation, args, query }) {
          const result = await query(args);
          import('./activity-logger').then(({ logActivity }) => {
            logActivity(globalForPrisma.prisma || new PrismaClient(), model, operation, args, result);
          });
          return result;
        },
        async update({ model, operation, args, query }) {
          const result = await query(args);
          import('./activity-logger').then(({ logActivity }) => {
            logActivity(globalForPrisma.prisma || new PrismaClient(), model, operation, args, result);
          });
          return result;
        },
        async delete({ model, operation, args, query }) {
          const result = await query(args);
          import('./activity-logger').then(({ logActivity }) => {
            logActivity(globalForPrisma.prisma || new PrismaClient(), model, operation, args, result);
          });
          return result;
        },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
