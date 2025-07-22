import * as analysisService from '../../services/analysisService';
import { sessionManager } from '../../models/session';
import { AnalysisResponse, SessionData } from '../../models/analysis';

jest.mock('pdf-parse', () => jest.fn());

const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;

const mockAnalysis: AnalysisResponse = {
  missing_keywords: ['React'],
  present_keywords: ['JavaScript'],
  recommendations: ['Add more React experience'],
  match_score: 80,
  summary: 'Good match'
};

describe('analysisService', () => {
  describe('extractTextFromFile', () => {
    it('should extract text from a plain text file', async () => {
      const file = { buffer: Buffer.from('hello world'), mimetype: 'text/plain' } as any;
      const text = await analysisService.extractTextFromFile(file);
      expect(text).toBe('hello world');
    });
  });

  describe('getAnalysisSession and setAnalysisSession', () => {
    it('should set and get a session', () => {
      const sessionId = 'test-session';
      const sessionData = { analysis: mockAnalysis, resumeText: 'resume', jobDescription: 'job', timestamp: Date.now() };
      analysisService.setAnalysisSession(sessionId, sessionData);
      expect(analysisService.getAnalysisSession(sessionId)).toEqual(sessionData);
    });
  });

  describe('analyzeResumeContent', () => {
    it('should return analysis and sessionId (mocked ai and sessionManager)', async () => {
      const ai = require('../../services/geminiClient').ai;
      ai.models = { generateContent: jest.fn().mockReturnValue(Promise.resolve({ text: JSON.stringify(mockAnalysis) })) };
      jest.spyOn(sessionManager, 'generateSessionId').mockReturnValue('mock-session-id');
      jest.spyOn(sessionManager, 'setSession').mockImplementation(() => {});
      const result = await analysisService.analyzeResumeContent('job', 'resume');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('sessionId', 'mock-session-id');
    });
  });

  describe('processResumeAnalysis', () => {
    it('should process resume and return analysis and sessionId', async () => {
      jest.spyOn(analysisService, 'extractTextFromFile').mockResolvedValue('resume text');
      jest.spyOn(analysisService, 'analyzeResumeContent').mockResolvedValue({ analysis: mockAnalysis, sessionId: 'mock-session-id' });
      const file = { buffer: Buffer.from('resume'), mimetype: 'text/plain' } as any;
      const result = await analysisService.processResumeAnalysis('job', file);
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('sessionId', 'mock-session-id');
    });
  });
});