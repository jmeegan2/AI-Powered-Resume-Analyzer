import { Request, Response } from 'express';
import { handleChatbotRequest } from '../services/chatbotService';

export const chatbot = async (req: Request, res: Response) => {
  try {
    const result = await handleChatbotRequest(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response from chatbot.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 