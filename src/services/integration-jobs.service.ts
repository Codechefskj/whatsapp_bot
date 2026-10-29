import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function enqueueIntegrationJob(kind: string, dedupeKey: string, payload: Prisma.InputJsonValue) {
  return prisma.integrationJob.upsert({
    where: { dedupeKey },
    create: { kind, dedupeKey, payload },
    update: {},
  });
}

export async function recoverIntegrationJobs() {
  await prisma.integrationJob.updateMany({
    where: { status: 'PROCESSING', updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    data: { status: 'RETRY', runAfter: new Date(), lastError: 'Recovered after worker restart.' },
  });
}