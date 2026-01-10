import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

console.log('✅ WhatsApp routes loaded');

router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📩 WhatsApp webhook POST received');

  // IMPORTANT: respond immediately
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || !message.text) {
      console.log('ℹ️ No user message (status / delivery event)');
      return;
    }

    const from = message.from;
    const textBody = message.text.body;
    const text = textBody.toLowerCase().trim();
    const messageId = message.id;

    console.log(`📨 From: ${from} | Text: ${text}`);

    // Save to DB
    await prisma.whatsAppMessage.create({
      data: {
        from,
        text: textBody,
        messageId,
      },
    });

    // Bot replies
    if (text === 'help') {
      await whatsappService.sendTextMessage(
        from,
        '👋 Commands:\n• help\n• menu\n• create'
      );
    } else if (text === 'menu') {
      await whatsappService.sendTextMessage(
        from,
        '📋 Menu:\n• create\n• approvals'
      );
    } else if (text === 'create') {
      await whatsappService.sendTextMessage(
        from,
        '🎨 Choose format:\n• Story\n• Post\n• Banner'
      );
    } else {
      await whatsappService.sendTextMessage(
        from,
        '🤖 Type "help" to see options'
      );
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
  }
});

/* ===== Test DB ===== */
router.get('/test-db', async (_req: Request, res: Response) => {
  const count = await prisma.whatsAppMessage.count();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ count, messages });
});

/* ===== Inbox API ===== */
router.get('/inbox', async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});


export default router;
