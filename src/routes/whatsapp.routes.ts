import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

console.log('✅ WhatsApp routes loaded');

/* =====================================================
   SEND DESIGN (Frontend → WhatsApp)  ✅ UNCHANGED
===================================================== */
router.post(
  '/send-design',
  upload.single('image') as any,
  async (req: Request, res: Response) => {
    try {
      console.log('🎨 Design approval request received');

      const { approver, recipientPhone } = req.body;
      const imageBuffer = req.file?.buffer;

      if (!imageBuffer) {
        return res.status(400).json({
          success: false,
          error: 'No image provided',
        });
      }

      if (!recipientPhone) {
        return res.status(400).json({
          success: false,
          error: 'No recipient phone number provided',
        });
      }

      const result = await whatsappService.sendDesignApproval(
        recipientPhone,
        imageBuffer,
        approver
      );

      // Save SYSTEM message (already working)
      await prisma.whatsAppMessage.create({
        data: {
          from: 'system',
          text: `Design sent by ${approver}`,
          messageId: result.messageId,
        },
      });

      res.json({
        success: true,
        mediaId: result.mediaId,
        messageId: result.messageId,
      });
    } catch (error: any) {
      console.error('❌ Error sending design:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send design',
      });
    }
  }
);

/* =====================================================
   WEBHOOK (WhatsApp → Backend → DB)  ✅ NEW LOGIC
===================================================== */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('📩 Incoming webhook');

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Ignore delivery/read status updates
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const messageId = message.id;

    let text = '[unsupported message]';

    if (message.type === 'text') {
      text = message.text.body;
    } else if (message.type === 'image') {
      text = message.image.caption || '[image]';
    }

    await prisma.whatsAppMessage.create({
      data: {
        from,
        text,
        messageId,
      },
    });

    console.log('✅ Incoming WhatsApp message saved to DB');
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook DB error:', error);
    res.sendStatus(500);
  }
});

export default router;