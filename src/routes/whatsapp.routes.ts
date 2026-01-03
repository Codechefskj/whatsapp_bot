// src/routes/whatsapp.routes.ts
import { Router, Request, Response } from 'express';
import { config } from '../config';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

/**
 * Webhook verification
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * Test endpoint to verify database works
 */
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Test creating a message
    const testMsg = await prisma.whatsAppMessage.create({
      data: {
        from: '1234567890',
        text: 'test message',
        messageId: `test_${Date.now()}`,
      },
    });

    // Get all messages
    const allMessages = await prisma.whatsAppMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      testMessage: testMsg,
      allMessages: allMessages,
      count: allMessages.length,
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Receive WhatsApp messages
 */
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('🔔 Webhook called!');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  // Respond fast to Meta
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    if (!entry) {
      console.log('❌ No entry in webhook');
      return;
    }

    const change = entry?.changes?.[0];
    if (!change) {
      console.log('❌ No change in webhook');
      return;
    }

    const message: WebhookMessage | undefined = change?.value?.messages?.[0];
    if (!message) {
      console.log('❌ No message in webhook');
      return;
    }

    const from = message.from;
    const messageId = message.id;
    const textBody = message.text?.body ?? '';
    const text = textBody.toLowerCase().trim();

    console.log('📩 Message received:');
    console.log('  From:', from);
    console.log('  Message ID:', messageId);
    console.log('  Original text:', textBody);
    console.log('  Processed text:', text);

    // ✅ SAVE MESSAGE TO DATABASE
    try {
      console.log('💾 Saving to database...');
      
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          from: from,
          text: textBody, // Save original text, not lowercase
          messageId: messageId,
        },
      });
      
      console.log('✅ Message saved successfully!');
      console.log('  Database ID:', savedMessage.id);
    } catch (dbError) {
      console.error('❌ Database error:');
      console.error('  Error:', dbError);
      console.error('  Error message:', (dbError as Error).message);
    }

    // Mark as read
    whatsappService.markAsRead(messageId).catch((err) => {
      console.error('Failed to mark as read:', err);
    });

    // Reply logic
    try {
      console.log(`🤖 Processing command: "${text}"`);
      
      if (text === 'help') {
        console.log('Sending help message...');
        await whatsappService.sendTextMessage(
          from,
          '👋 Welcome!\n\nCommands:\n• help\n• menu\n• create'
        );
        console.log('✅ Help message sent');
      } else if (text === 'menu') {
        console.log('Sending menu...');
        await whatsappService.sendTextMessage(
          from,
          '📋 Menu:\n• create\n• approvals'
        );
        console.log('✅ Menu sent');
      } else if (text === 'create') {
        console.log('Sending create options...');
        await whatsappService.sendTextMessage(
          from,
          '🎨 Choose format:\n• Story\n• Post\n• Banner'
        );
        console.log('✅ Create options sent');
      } else {
        console.log('Sending default response...');
        await whatsappService.sendTextMessage(
          from,
          '🤖 I did not understand.\nType "help"'
        );
        console.log('✅ Default response sent');
      }
    } catch (sendError) {
      console.error('❌ Failed to send message:', sendError);
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('Stack:', (error as Error).stack);
  }
});

export default router;