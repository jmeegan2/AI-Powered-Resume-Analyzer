require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require("@google/genai");

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
You are a professional resume analyzer. I will provide you with a job description and a resume. 

Please analyze the resume against the job description and provide:

1. **Missing Keywords**: List the important keywords/skills from the job description that are missing or underrepresented in the resume
2. **Keyword Match Analysis**: Identify which keywords from the job description are present in the resume
3. **Recommendations**: Suggest specific improvements to make the resume more aligned with the job description
4. **Overall Match Score**: Rate the resume's alignment with the job description (1-10)

Format your response as JSON with the following structure:
{
  "missingKeywords": ["keyword1", "keyword2", ...],
  "presentKeywords": ["keyword1", "keyword2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "matchScore": 7,
  "analysis": "Brief summary of the analysis"
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
    });

    const response = await model;
    const analysisText = response.text;

    // Try to parse the response as JSON, fallback to text if it's not valid JSON
    let analysis;
    try {
      let cleaned = analysisText.trim();
      // Remove triple backticks and optional "json" after them
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      }
      analysis = JSON.parse(cleaned);
    } catch (error) {
      // If Gemini didn't return valid JSON, create a structured response
      analysis = {
        missingKeywords: [],
        presentKeywords: [],
        recommendations: [],
        matchScore: 5,
        analysis: analysisText,
        rawResponse: analysisText
      };
    }

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
