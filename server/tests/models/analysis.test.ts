import { AnalysisResponse, SessionData, ChatMessage, ChatRequest } from '../../models/analysis';

describe('AnalysisResponse interface', () => {
  it('should match the expected structure and types', () => {
    const mockAnalysis: AnalysisResponse = {
      missing_keywords: ['JavaScript', 'TypeScript'],
      present_keywords: ['React', 'Node.js'],
      recommendations: ['Add more TypeScript experience'],
      match_score: 85,
      summary: 'Good match, but missing some keywords.'
    };

    expect(Array.isArray(mockAnalysis.missing_keywords)).toBe(true);
    expect(typeof mockAnalysis.match_score).toBe('number');
    expect(typeof mockAnalysis.summary).toBe('string');
    expect(mockAnalysis.missing_keywords).toContain('JavaScript');
    expect(mockAnalysis.present_keywords).toContain('React');
    expect(mockAnalysis.recommendations.length).toBeGreaterThan(0);
  });
});

describe('SessionData interface', () => {
  it('should match the expected structure and types', () => {
    const mockSession: SessionData = {
      analysis: {
        missing_keywords: [],
        present_keywords: [],
        recommendations: [],
        match_score: 0,
        summary: ''
      },
      resumeText: 'Sample resume',
      jobDescription: 'Sample job',
      timestamp: Date.now()
    };
    expect(typeof mockSession.resumeText).toBe('string');
    expect(typeof mockSession.jobDescription).toBe('string');
    expect(typeof mockSession.timestamp).toBe('number');
    expect(typeof mockSession.analysis).toBe('object');
  });
});

describe('ChatMessage interface', () => {
  it('should match the expected structure and types', () => {
    const mockMessage: ChatMessage = {
      sender: 'user',
      text: 'Hello!'
    };
    expect(['user', 'assistant']).toContain(mockMessage.sender);
    expect(typeof mockMessage.text).toBe('string');
  });
});

describe('ChatRequest interface', () => {
  it('should match the expected structure and types', () => {
    const mockRequest: ChatRequest = {
      message: 'Hi',
      messageHistory: [
        { sender: 'user', text: 'Hi' },
        { sender: 'assistant', text: 'Hello!' }
      ],
      sessionId: 'abc123'
    };
    expect(typeof mockRequest.message).toBe('string');
    expect(Array.isArray(mockRequest.messageHistory)).toBe(true);
    expect(
      mockRequest.messageHistory?.every(
        (msg) => typeof msg.text === 'string' && ['user', 'assistant'].includes(msg.sender)
      )
    ).toBe(true);
    expect(typeof mockRequest.sessionId === 'string' || mockRequest.sessionId === null).toBe(true);
  });
});