import { getAnalysisSession, createGeminiClient } from './analysisService';
import { ChatRequest } from '../models/analysis';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}
const ai = createGeminiClient(apiKey);

function buildSystemInstruction(sessionData: any = null): string {
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

export async function handleChatbotRequest(body: ChatRequest): Promise<string> {
  const { message, messageHistory = [], sessionId = null } = body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Message is required and must be a non-empty string.');
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
  const sessionData = sessionId ? getAnalysisSession(sessionId) : null;

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
  return result.text ?? "";
} 