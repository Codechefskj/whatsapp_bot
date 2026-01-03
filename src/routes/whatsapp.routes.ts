import { Router, Request, Response } from 'express';
import { config } from '../config';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

/**
 * Webhook verification (Meta)
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔐 Webhook verify request');

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * Receive messages
 */
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📨 Incoming webhook');
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200); // must respond fast

  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message) {
    console.log('⚠️ No message found (maybe status update)');
    return;
  }

  const from = message.from;
  const messageId = message.id;
  const text = message.text?.body?.toLowerCase();

  console.log('📩 From:', from);
  console.log('📩 Text:', text);

  await whatsappService.markAsRead(messageId);

  if (text === 'help') {
    await whatsappService.sendTextMessage(
      from,
      '👋 Welcome!\n\nCommands:\n• help\n• menu\n• create'
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
      '🤖 I did not understand.\nType "help"'
    );
  }
});

/**
 * Test send API
 */
router.post('/test-send', async (req: Request, res: Response) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'to and message required' });
  }

  const result = await whatsappService.sendTextMessage(to, message);
  res.json({ success: true, result });
});

export default router;
