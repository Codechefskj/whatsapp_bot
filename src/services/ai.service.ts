import axios from 'axios';
import { config } from '../config';

export class AIService {
  async getReply(userMessage: string): Promise<string> {
    try {
      console.log('🌐 Calling AI URL:', config.ai.apiUrl);

      const response = await axios.post(
        config.ai.apiUrl,
        { message: userMessage },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );

      console.log('📦 AI raw response:', JSON.stringify(response.data));

      const reply = response.data?.level_1_simple_answer;
      if (!reply) throw new Error('No level_1_simple_answer in response');
      return reply;

    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error('❌ AI timeout — service is cold starting on Render');
      } else {
        console.error('❌ AI error:', error.response?.data || error.message);
      }
      throw new Error('AI failed');
    }
  }
}