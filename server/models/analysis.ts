// AnalysisResponse interface for resume analysis results
export interface AnalysisResponse {
  missing_keywords: string[];
  present_keywords: string[];
  recommendations: string[];
  match_score: number;
  summary: string;
}

// SessionData interface for storing analysis sessions
export interface SessionData {
  analysis: AnalysisResponse;
  resumeText: string;
  jobDescription: string;
  timestamp: number;
}

// ChatMessage interface for chatbot conversation
export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

// ChatRequest interface for chatbot endpoint
export interface ChatRequest {
  message: string;
  messageHistory?: ChatMessage[];
  sessionId?: string | null;
} 