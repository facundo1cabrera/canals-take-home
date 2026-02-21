import type { PrismaClient } from '@repo/db';

export const PRISMA_TOKEN = Symbol('PRISMA_TOKEN');

export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

