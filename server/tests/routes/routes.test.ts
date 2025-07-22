import request from 'supertest';
import express from 'express';
import routes from '../../routes/routes';
import * as analysisService from '../../services/analysisService';
import * as chatbotService from '../../services/chatbotService';

// Set up an express app instance for integration testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

describe('Routes', () => {
  describe('POST /api/analyze-resume', () => {
    it('should return 400 if jobDescription or resume file is missing', async () => {
      const res = await request(app)
        .post('/api/analyze-resume')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 200 and analysis for valid input', async () => {
      jest.spyOn(analysisService, 'processResumeAnalysis').mockResolvedValue({
        analysis: {
          missing_keywords: ['React'],
          present_keywords: ['JavaScript'],
          recommendations: ['Add more React experience'],
          match_score: 80,
          summary: 'Good match'
        },
        sessionId: 'mock-session-id'
      });

      const res = await request(app)
        .post('/api/analyze-resume')
        .attach('resume', Buffer.from('resume content'), 'resume.txt')
        .field('jobDescription', 'Software Engineer');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('sessionId');
    });
  });

  describe('POST /api/chatbot', () => {
    it('should return 500 if message is missing', async () => {
      const res = await request(app)
        .post('/api/chatbot')
        .send({});
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 200 and chatbot response for valid input', async () => {
      jest.spyOn(chatbotService, 'handleChatbotRequest').mockResolvedValue('Hello, how can I help you?');
      const res = await request(app)
        .post('/api/chatbot')
        .send({ message: 'Hi' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data', 'Hello, how can I help you?');
    });
  });
});