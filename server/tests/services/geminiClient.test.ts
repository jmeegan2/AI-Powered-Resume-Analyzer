import { ai } from '../../services/geminiClient';
import { GoogleGenAI } from '@google/genai';

describe('geminiClient', () => {
  it('should export an instance of GoogleGenAI', () => {
    expect(ai).toBeInstanceOf(GoogleGenAI);
  });

  it('should throw if GEMINI_API_KEY is missing', () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    jest.resetModules();
    expect(() => require('../../services/geminiClient')).toThrow('GEMINI_API_KEY environment variable is required');
    process.env.GEMINI_API_KEY = original;
  });
});