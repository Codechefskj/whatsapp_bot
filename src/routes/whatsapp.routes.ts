import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

console.log('✅ WhatsApp routes loaded');

interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

/* ===================== RECEIVE MESSAGES ===================== */
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📩 WhatsApp webhook POST received');

  // Respond immediately (Meta requirement)
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message: WebhookMessage | undefined = change?.value?.messages?.[0];

    if (!message) {
      console.log('No message found');
      return;
    }

    const from = message.from;
    const messageId = message.id;
    const textBody = message.text?.body ?? '';
    const text = textBody.toLowerCase().trim();

    console.log(`📨 From: ${from} | Text: ${text}`);

    // Save message to DB
    await prisma.whatsAppMessage.create({
      data: {
        from,
        text: textBody,
        messageId,
      },
    });

    // Bot replies
    if (text === 'help') {
      await whatsappService.sendTextMessage(from, '👋 Commands:\n• help\n• menu\n• create');
    } else if (text === 'menu') {
      await whatsappService.sendTextMessage(from, '📋 Menu:\n• create\n• approvals');
    } else if (text === 'create') {
      await whatsappService.sendTextMessage(from, '🎨 Choose format:\n• Story\n• Post\n• Banner');
    } else {
      await whatsappService.sendTextMessage(from, '🤖 Type "help" to see options');
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
  }
});

/* ===================== TEST DB ===================== */
router.get('/test-db', async (_req: Request, res: Response) => {
  const count = await prisma.whatsAppMessage.count();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ count, messages });
});

export default router;
