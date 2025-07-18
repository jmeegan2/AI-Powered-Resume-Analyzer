import { Request, Response } from 'express';
import { createGeminiClient, processResumeAnalysis } from '../services/analysisService';
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required ');
  process.exit(1);
}
const ai = createGeminiClient(apiKey);

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    // Input validation
    if (!jobDescription || !resumeFile) {
      return res.status(400).json({
        error: 'Both job description and resume file are required'
      });
    }

    // Delegate all business logic to service
    const { analysis, sessionId } = await processResumeAnalysis(jobDescription, resumeFile, ai);

    // Format and send response
    res.json({
      success: true,
      analysis,
      sessionId
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 