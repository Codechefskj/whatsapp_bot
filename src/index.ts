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

/* ===== HARD DEBUG ROUTE (CRITICAL) ===== */
app.get('/__debug', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    message: 'DEBUG ROUTE IS ACTIVE',
    time: new Date().toISOString(),
  });
});

/* ===== Meta Webhook Verification ===== */
app.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'bestsecretkeytoverify') {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* ===== Health Check ===== */
app.get('/health', (_req: Request, res: Response) => {
  res.send('OK');
});

/* ===== WhatsApp Routes ===== */
app.use('/whatsapp', whatsappRoutes);

/* ===== 404 (MUST BE LAST) ===== */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

/* ===== Start Server ===== */
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});
