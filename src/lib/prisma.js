import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    console.log('[PRISMA] initialized, models:', Object.keys(client).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    return client;
  } catch (e) {
    console.error('[PRISMA] init error:', e.message);
    throw e;
  }
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
