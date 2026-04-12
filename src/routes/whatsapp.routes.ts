import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { AIService } from '../services/ai.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();
const aiService = new AIService();

console.log('✅ WhatsApp routes loaded');

// ============================
// 🔥 WEBHOOK (RECEIVE MESSAGE)
// ============================
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📩 WhatsApp webhook POST received');
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || !message.text) {
      console.log('ℹ️ No user message (status/delivery event)');
      return;
    }

    const from = message.from;
    const textBody = message.text.body;
    const text = textBody.toLowerCase().trim();
    const messageId = message.id;

    console.log(`📨 From: ${from} | Text: ${textBody}`);

    await prisma.whatsAppMessage.create({
      data: { from, text: textBody, messageId },
    });

    console.log('💾 Saved message to DB');

    let reply = '';

    if (text === 'help') {
      reply = '👋 Commands:\n• help\n• menu\n• create';
    } else if (text === 'menu') {
      reply = '📋 Menu:\n• create\n• approvals';
    } else if (text === 'create') {
      reply = '🎨 Choose format:\n• Story\n• Post\n• Banner';
    } else {
      console.log('🤖 Calling AI...');
      try {
        reply = await aiService.getReply(textBody);
      } catch (aiError) {
        reply = '⚠️ You have reached the free limit. Please try again later.';
      }
    }

    console.log('🤖 Reply:', reply);

    await whatsappService.sendTextMessage(from, reply);
    console.log('✅ Reply sent');

  } catch (error: any) {
    console.error('❌ Webhook error:', error.response?.data || error.message);
  }
});

// ============================
// 🚀 TEST SEND API (POSTMAN)
// ============================
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'to and text are required' });
    }

    console.log('🧪 Sending test message...');
    const result = await whatsappService.sendTextMessage(to, text);
    res.json({ success: true, result });

  } catch (error: any) {
    console.error('❌ Send test error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ============================
// 📊 TEST DB
// ============================
router.get('/test-db', async (_req: Request, res: Response) => {
  const count = await prisma.whatsAppMessage.count();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ count, messages });
});

// ============================
// 📥 INBOX API
// ============================
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

router.get('/test-ai', async (_req: Request, res: Response) => {
  try {
    const reply = await aiService.getReply('test question');
    res.json({ success: true, reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;