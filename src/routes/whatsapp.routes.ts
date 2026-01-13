import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';

const router = Router();
const whatsappService = new WhatsAppService();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

console.log('✅ WhatsApp routes loaded');

// NEW ROUTE - Add this
router.post('/send-design', upload.single('image') as any, async (req: Request, res: Response) => {
  try {
    console.log('🎨 Design approval request received');
    
    const { approver, recipientPhone } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided' 
      });
    }

    if (!recipientPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'No recipient phone number provided' 
      });
    }

    console.log(`📤 Sending to: ${recipientPhone}`);
    console.log(`👤 From: ${approver}`);
    console.log(`📸 Image size: ${imageBuffer.length} bytes`);

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

    res.json({
      success: true,
      mediaId: result.mediaId,
      messageId: result.messageId,
      message: 'Design sent successfully',
    });

  } catch (error: any) {
    console.error('❌ Error sending design:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Failed to send design',
    });
  }
});

// Your existing webhook route stays here
router.post('/webhook', async (req: Request, res: Response) => {
  // ... existing code ...
});

// Rest of your existing routes...

export default router;