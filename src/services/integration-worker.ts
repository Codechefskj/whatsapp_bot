import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AgenticService } from './agentic.service';
import { WhatsAppService } from './whatsapp.service';
import { recoverIntegrationJobs } from './integration-jobs.service';

const agentic = new AgenticService();
const whatsapp = new WhatsAppService();
let working = false;

type Payload = Record<string, any>;

async function processInbound(payload: Payload) {
  const session = await prisma.conversationSession.upsert({
    where: { phone: payload.from },
    create: { phone: payload.from },
    update: {},
  });
  const file = payload.mediaId ? await whatsapp.downloadMedia(payload.mediaId) : undefined;
  const result = await agentic.processMessage({
    phone: payload.from,
    messageId: payload.messageId,
    text: payload.text,
    productDraftId: session.status === 'AWAITING_CLARIFICATION' ? session.productDraftId : null,
    questionId: session.status === 'AWAITING_CLARIFICATION' ? session.pendingQuestionId : null,
    file,
  });
  if (result.kind === 'clarification_required' && result.draft && result.question) {
    await prisma.conversationSession.update({
      where: { phone: payload.from },
      data: { productDraftId: result.draft.id, pendingQuestionId: result.question.id, status: 'AWAITING_CLARIFICATION' },
    });
    const options = result.question.options?.length ? `\nOptions: ${result.question.options.join(', ')}` : '';
    await whatsapp.sendTextMessage(payload.from, `${result.question.prompt}${options}`);
    return;
  }
  if (result.kind === 'design_ready' && result.job) {
    await prisma.conversationSession.update({
      where: { phone: payload.from },
      data: { productDraftId: result.draft?.id, pendingQuestionId: null, designJobId: result.job.id, status: 'AWAITING_APPROVAL' },
    });
  }
}

async function processFeedback(payload: Payload) {
  const result = await agentic.sendFeedback(payload as any);
  if (payload.to) {
    await prisma.conversationSession.upsert({
      where: { phone: payload.to },
      create: {
        phone: payload.to,
        designJobId: payload.externalRef,
        status: result.kind === 'approved' ? 'COMPLETE' : 'AWAITING_APPROVAL',
      },
      update: {
        designJobId: payload.externalRef,
        status: result.kind === 'approved' ? 'COMPLETE' : 'AWAITING_APPROVAL',
      },
    });
  }
}

async function processOne() {
  if (working) return;
  working = true;
  try {
    const candidate = await prisma.integrationJob.findFirst({
      where: { status: { in: ['PENDING', 'RETRY'] }, runAfter: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return;
    const claimed = await prisma.integrationJob.updateMany({
      where: { id: candidate.id, status: candidate.status },
      data: { status: 'PROCESSING', attempts: { increment: 1 }, lastError: null },
    });
    if (!claimed.count) return;
    try {
      const payload = candidate.payload as Payload;
      if (candidate.kind === 'INBOUND_MESSAGE') await processInbound(payload);
      else if (candidate.kind === 'AGENTIC_FEEDBACK') await processFeedback(payload);
      else throw new Error(`Unknown integration job kind: ${candidate.kind}`);
      await prisma.integrationJob.update({ where: { id: candidate.id }, data: { status: 'COMPLETED' } });
    } catch (error: any) {
      const attempts = candidate.attempts + 1;
      const failed = attempts >= 8;
      const delay = Math.min(300_000, 2 ** attempts * 1000);
      await prisma.integrationJob.update({
        where: { id: candidate.id },
        data: {
          status: failed ? 'FAILED' : 'RETRY',
          runAfter: new Date(Date.now() + delay),
          lastError: String(error.response?.data?.error || error.message || error).slice(0, 1000),
        },
      });
      if (failed) {
        const recipient = (candidate.payload as Payload).to || (candidate.payload as Payload).from;
        if (recipient) {
          await whatsapp.sendTextMessage(recipient, 'We could not finish this design request automatically. The team can safely retry it using the same message.').catch(() => {});
        }
      }
      console.error(`❌ Integration job ${candidate.id} failed${failed ? ' permanently' : ', retry scheduled'}:`, error.response?.data || error.message);
    }
  } finally {
    working = false;
  }
}

export async function startIntegrationWorker() {
  await recoverIntegrationJobs();
  setInterval(() => void processOne(), Math.max(250, config.agentic.pollIntervalMs));
  void processOne();
  console.log('✅ Durable Agentic integration worker started');
}