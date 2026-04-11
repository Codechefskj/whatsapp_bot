import axios from 'axios';
import { config } from '../config';

export class AIService {
  async getReply(userMessage: string): Promise<string> {
    try {
      const response = await axios.post(
        config.ai.apiUrl,
        { question: userMessage },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const reply = response.data?.level_1_simple_answer;
      if (!reply) throw new Error('No level_1_simple_answer in response');
      return reply;

    } catch (error: any) {
      console.error('❌ AI error:', error.response?.data || error.message);
      return '⚠️ Something went wrong. Please try again.';
    }
  }
}