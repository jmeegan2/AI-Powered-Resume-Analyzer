import * as chatbotService from '../../services/chatbotService';
import * as analysisService from '../../services/analysisService';

jest.mock('../../services/geminiClient', () => ({
  ai: {
    models: {
      generateContent: jest.fn().mockReturnValue(Promise.resolve({ text: 'AI response' }))
    }
  }
}));

describe('chatbotService', () => {
  it('should throw if message is missing', async () => {
    await expect(chatbotService.handleChatbotRequest({ message: '' })).rejects.toThrow('Message is required');
    await expect(chatbotService.handleChatbotRequest({} as any)).rejects.toThrow('Message is required');
  });

  it('should return AI response for valid input', async () => {
    const result = await chatbotService.handleChatbotRequest({ message: 'Hi' });
    expect(result).toBe('AI response');
  });

  it('should use session context if sessionId is provided', async () => {
    jest.spyOn(analysisService, 'getAnalysisSession').mockReturnValue({
      analysis: {
        missing_keywords: [],
        present_keywords: [],
        recommendations: [],
        match_score: 0,
        summary: ''
      },
      resumeText: 'resume',
      jobDescription: 'job',
      timestamp: Date.now()
    });
    const result = await chatbotService.handleChatbotRequest({ message: 'Hi', sessionId: 'abc' });
    expect(result).toBe('AI response');
  });
});