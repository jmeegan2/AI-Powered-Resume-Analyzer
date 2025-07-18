import pdfParse from 'pdf-parse';
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, SessionData } from '../models/analysis';
import { sessionManager } from '../models/session';
import multer from 'multer';
import { ai } from './geminiClient';

// Configure multer for resume file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Define the response schema for Gemini output
export const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    present_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    match_score: { type: Type.NUMBER },
    summary: { type: Type.STRING }
  },
  required: ["missing_keywords", "present_keywords", "recommendations", "match_score", "summary"]
};

// Helper function to extract text from different file types
export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const buffer = file.buffer;
  const mimetype = file.mimetype;

  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (mimetype === 'application/pdf') {
    // Use pdf-parse to extract text from PDF
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      throw new Error('Failed to extract text from PDF.');
    }
  }

  if (mimetype.includes('word')) {
    throw new Error('DOC/DOCX text extraction not implemented. Please convert to TXT format.');
  }

  return buffer.toString('utf-8');
}

export function getAnalysisSession(sessionId: string): SessionData | undefined {
  return sessionManager.getSession(sessionId);
}

export function setAnalysisSession(sessionId: string, sessionData: SessionData): void {
  sessionManager.setSession(sessionId, sessionData);
}

// Business logic for resume analysis
export async function analyzeResumeContent(jobDescription: string, resumeText: string): Promise<{ analysis: AnalysisResponse; sessionId: string }> {
  // Create prompt for Gemini
  const prompt = `
Analyze the provided resume against the job description from an ATS perspective.

**Job Description:**
${jobDescription}

---

**Resume:**
${resumeText}

---

**Instructions:**
1.  **missing_keywords**: List essential keywords from the job description that are missing in the resume.
2.  **present_keywords**: List keywords from the job description that are present in the resume.
3.  **recommendations**: Provide actionable advice to improve the resume's keyword alignment.
4.  **match_score**: Score the resume's keyword match on a scale of 1 to 100.
5.  **summary**: A brief two-sentence analysis of the resume's ATS-friendliness.
`;

  // Generate analysis using Gemini
  const model = ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema
    }
  });

  const response = await model;
  const analysis: AnalysisResponse = JSON.parse(response.text || '{}');

  // Generate session ID and store full context
  const sessionId = sessionManager.generateSessionId();
  setAnalysisSession(sessionId, {
    analysis,
    resumeText,
    jobDescription,
    timestamp: Date.now()
  });

  return { analysis, sessionId };
}

// Complete resume analysis process including file extraction
export async function processResumeAnalysis(jobDescription: string, resumeFile: Express.Multer.File): Promise<{ analysis: AnalysisResponse; sessionId: string }> {
  try {
    // Extract text from resume
    const resumeText = await extractTextFromFile(resumeFile);
    
    // Analyze the resume content
    return await analyzeResumeContent(jobDescription, resumeText);
  } catch (error) {
    throw new Error(`Resume processing failed: ${error}`);
  }
} 