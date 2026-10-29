import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!,
    appSecret: process.env.META_APP_SECRET!,
  },
  ai: {
    apiUrl: process.env.AI_API_URL || '',
  },
  agentic: {
    baseUrl: (process.env.AGENTIC_API_URL || 'http://127.0.0.1:8787').replace(/\/$/, ''),
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    requestTimeoutMs: Number(process.env.AGENTIC_REQUEST_TIMEOUT_MS || 120000),
    pollIntervalMs: Number(process.env.INTEGRATION_POLL_INTERVAL_MS || 1000),
  },
};

if (!config.meta.accessToken || !config.meta.phoneNumberId || !config.meta.webhookVerifyToken || !config.meta.appSecret) {
  console.error('❌ Missing Meta environment variables');
  process.exit(1);
}

if (!config.agentic.internalToken) {
  console.error('❌ Missing INTERNAL_SERVICE_TOKEN');
  process.exit(1);
}

console.log('✅ Config loaded');