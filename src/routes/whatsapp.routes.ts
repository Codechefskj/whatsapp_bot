import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

/* ===== Multer Setup ===== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

console.log('✅ WhatsApp routes loaded');

/* =====================================================
   SEND DESIGN (Frontend → WhatsApp) ✅ NO CHANGE
===================================================== */
router.post(
  '/send-design',
  upload.single('image') as any,
  async (req: Request, res: Response) => {
    try {
      const { approver, recipientPhone } = req.body;
      const imageBuffer = req.file?.buffer;

      if (!imageBuffer || !recipientPhone) {
        return res.status(400).json({ success: false });
      }

      const result = await whatsappService.sendDesignApproval(
        recipientPhone,
        imageBuffer,
        approver
      );

      await prisma.whatsAppMessage.create({
        data: {
          from: 'system',
          text: `Design sent by ${approver}`,
          messageId: result.messageId,
        },
      });

      res.json({ success: true });
    } catch (err) {
      console.error('❌ Send design error:', err);
      res.status(500).json({ error: 'Send failed' });
    }
  }
);

/* =====================================================
   WEBHOOK (WhatsApp → DB) ✅ FIXED
===================================================== */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // ❌ Ignore status updates
    if (value?.statuses) {
      return res.sendStatus(200);
    }

    const message = value?.messages?.[0];
    if (!message) {
      return res.sendStatus(200);
    }

    let text = '[unsupported]';

    if (message.type === 'text') {
      text = message.text.body;
    }

    if (message.type === 'image') {
      text = message.image.caption || '[image]';
    }

    try {
      await prisma.whatsAppMessage.create({
        data: {
          from: message.from,
          text,
          messageId: message.id,
        },
      });

      console.log('✅ Message saved:', message.id);
    } catch (dbErr: any) {
      // ✅ Ignore duplicate message retries
      if (dbErr.code === 'P2002') {
        console.log('⚠️ Duplicate message ignored:', message.id);
      } else {
        console.error('❌ Prisma error:', dbErr);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook fatal error:', err);
    res.sendStatus(500);
  }
});

/* =====================================================
   INBOX (Frontend → DB) ✅ OK
===================================================== */
router.get('/inbox', async (_req: Request, res: Response) => {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(messages);
});

export default router;
