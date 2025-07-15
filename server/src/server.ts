import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Types
interface AnalysisResponse {
  missing_keywords: string[];
  present_keywords: string[];
  recommendations: string[];
  match_score: number;
  summary: string;
}

interface SessionData {
  analysis: AnalysisResponse;
  resumeText: string;
  jobDescription: string;
  timestamp: number;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  message: string;
  messageHistory?: ChatMessage[];
  sessionId?: string | null;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// In-memory storage for analysis sessions (in production, use Redis or database)
const analysisSessions = new Map<string, SessionData>();

// Define the response schema for Gemini output
const analysisResponseSchema = {
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
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
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

// Resume analysis endpoint
app.post('/api/analyze-resume', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    if (!jobDescription || !resumeFile) {
      return res.status(400).json({
        error: 'Both job description and resume file are required'
      });
    }

    // Extract text from resume
    let resumeText: string;
    try {
      resumeText = await extractTextFromFile(resumeFile);
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

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
        responseMimeType: "application/json", //we want to use json since its structured data
        responseSchema: analysisResponseSchema
      }
    });

    const response = await model;
    const analysis: AnalysisResponse = JSON.parse(response.text || '{}');

    // Generate session ID and store full context
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    analysisSessions.set(sessionId, {
      analysis,
      resumeText,
      jobDescription,
      timestamp: Date.now()
    });

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
});

function buildSystemInstruction(sessionData: SessionData | null = null): string {
  const baseInstruction = `You are a helpful AI assistant for a resume analysis application. 
- Keep responses concise (2-3 sentences)
- Be professional
- You can help with any questions, resume-related or not`;

  if (!sessionData) return baseInstruction;

  const { analysis, resumeText, jobDescription } = sessionData;
  
  return `${baseInstruction}

**Current Resume Analysis Context:**
- Match Score: ${analysis.match_score}/100
- Missing Keywords: ${analysis.missing_keywords?.join(', ') || 'None'}
- Present Keywords: ${analysis.present_keywords?.join(', ') || 'None'}
- Summary: ${analysis.summary || 'No summary available'}

**Job Description:**
${jobDescription}

**Resume Content:**
${resumeText}

**Instructions for Resume-Related Questions:**
- If asked about match score, explain based on the actual score
- If asked about missing keywords, provide specific suggestions
- If asked about improvements, reference the actual recommendations
- If asked about skills, suggest adding the missing keywords
- If asked about specific content, reference the actual resume text
- If asked about job requirements, reference the actual job description
- Always be specific and actionable based on the analysis data`;
}

app.post('/api/chatbot', async (req: Request, res: Response) => {
  try {
    const { message, messageHistory = [], sessionId = null }: ChatRequest = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.'
      });
    }

    // Build conversation history for context
    const conversationHistory = messageHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Get session data if available
    const sessionData = sessionId ? analysisSessions.get(sessionId) : null;

    // Use the streamlined function to build system instruction
    const systemInstructionText = buildSystemInstruction(sessionData);

    const systemInstruction = {
      role: 'user',
      parts: [{ text: systemInstructionText }]
    };

    // Generate analysis using Gemini with conversation history
    const model = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [systemInstruction, ...conversationHistory]
    });

    const result = await model;
    
    res.json({
      success: true,
      data: result.text
    });

  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response from chatbot.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Resume Analyzer API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}); 