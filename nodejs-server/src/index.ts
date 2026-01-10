import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import whatsappRoutes from './routes/whatsapp.routes';
import { config } from './config';

const app = express();

/* ===== Middlewares ===== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* ===== Meta Webhook Verification ===== */
app.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔐 Meta verification request');
  console.log({ mode, token, challenge });

  // 🔴 HARD-CODE TOKEN
  if (mode === 'subscribe' && token === 'bestsecretkeytoverify') {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  console.log('❌ Verification failed');
  return res.sendStatus(403);
});


/* ===== Basic Routes ===== */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'running',
    service: 'WhatsApp Bot',
    endpoints: {
      webhook: '/whatsapp/webhook',
      testDb: '/whatsapp/test-db',
      health: '/health',
    },
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.send('OK');
});

/* ===== WhatsApp Routes ===== */
app.use('/whatsapp', whatsappRoutes);

/* ===== 404 ===== */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

/* ===== Start Server ===== */
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});
