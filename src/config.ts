import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!,
  },
  ai: {
    apiUrl: process.env.AI_API_URL!,
  },
};

if (!config.meta.accessToken || !config.meta.phoneNumberId || !config.meta.webhookVerifyToken) {
  console.error('❌ Missing Meta environment variables');
  process.exit(1);
}

if (!config.ai.apiUrl) {
  console.error('❌ Missing AI_API_URL');
  process.exit(1);
}

console.log('✅ Config loaded');