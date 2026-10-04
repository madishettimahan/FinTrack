import { PrismaClient } from '@prisma/client';

declare global {
  // allow global prisma in development to avoid exhausted pool on hot-reloading
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
