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
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Define the response schema for Gemini output
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    missingKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    presentKeywords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          found_in_resume: { type: Type.STRING },
          section: { type: Type.STRING }
        },
        propertyOrdering: ["keyword", "found_in_resume", "section"]
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    matchScore: { type: Type.NUMBER },
    analysis: { type: Type.STRING }
  },
  propertyOrdering: [
    "missingKeywords",
    "presentKeywords",
    "recommendations",
    "matchScore",
    "analysis"
  ]
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
    const prompt = `{
  "prompt": "You are a professional resume analyzer specializing in Applicant Tracking Systems (ATS) optimization. I will provide you with a job description and a resume. Your goal is to identify how well the resume aligns with the job description's ATS-relevant keywords and provide actionable feedback. Focus on direct matches and common synonyms that an ATS would recognize.",
  "analysis_tasks": [
    {
      "task_name": "missingKeywords",
      "description": "Identify and list all distinct keywords and key phrases from the 'Responsibilities' and 'Requirements' sections of the job description that are either completely absent from the resume or significantly underrepresented (e.g., mentioned only once when clearly a core requirement). Consider both single words (e.g., 'React') and multi-word phrases (e.g., 'test-driven development')."
    },
    {
      "task_name": "presentKeywords",
      "description": "List all distinct keywords and key phrases from the 'Responsibilities' and 'Requirements' sections of the job description that are clearly present in the resume. For each keyword, indicate if it's a direct match or a strong synonym/related concept that an ATS would likely identify. Prioritize keywords that appear in the 'Experience' or 'Technical Skills' sections."
    },
    {
      "task_name": "recommendations",
      "description": "Provide specific, actionable recommendations for modifying the resume to improve its ATS keyword density and relevance. Recommendations should include: 1. How to incorporate missing keywords into specific sections (e.g., 'Add 'GraphQL' to your 'Experience' bullet points by describing a relevant project.'). 2. How to expand on existing keywords for stronger ATS recognition (e.g., 'Elaborate on 'CI/CD' experience with tools like Jenkins or GitHub Actions.'). 3. Suggestions for tailoring the 'Profile' or 'Summary' section to include high-priority keywords from the job description. 4. Advice on quantifying achievements where possible to demonstrate impact for ATS and human readers."
    },
    {
      "task_name": "matchScore",
      "description": "Provide an overall numerical score (1-100) representing the resume's alignment with the job description, specifically from an ATS perspective. A higher score indicates better keyword matching and relevance."
    },
    {
      "task_name": "analysis",
      "description": "Provide a brief, concise summary (2-3 sentences) of the ATS analysis, highlighting the resume's strengths in keyword matching and the primary areas for improvement."
    }
  ],
}

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

    // Generate analysis using Gemini
    const model = ai.models.generateContent({
      model: "gemini-2.5-flash",
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Resume Analyzer API is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
