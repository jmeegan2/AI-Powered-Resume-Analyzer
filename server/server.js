require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenAI, Type } = require("@google/genai");

const app = express();
const port = process.env.PORT || 5001;

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
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
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
async function extractTextFromFile(file) {
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
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    if (!jobDescription || !resumeFile) {
      return res.status(400).json({
        error: 'Both job description and resume file are required'
      });
    }

    // Extract text from resume
    let resumeText;
    try {
      resumeText = await extractTextFromFile(resumeFile);
    } catch (error) {
      return res.status(400).json({
        error: error.message
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
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema
      }
    });

    const response = await model;
    const analysis = JSON.parse(response.text);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      details: error.message
    });
  }
});


app.post('/api/chatbot', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.'
      });
    }

   // Generate analysis using Gemini
   const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message
  });

    const result = await model
    const responseText = result.text

    res.json({
      success: true,
      data: responseText
    });

  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response from chatbot.',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Resume Analyzer API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
