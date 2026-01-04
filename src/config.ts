import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!
  }
};