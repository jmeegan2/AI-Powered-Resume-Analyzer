import { Router } from 'express';
import { analyzeResume } from '../controllers/analysisController';
import { chatbot } from '../controllers/chatbotController';
import { upload } from '../services/analysisService';

const router = Router();

// Resume analysis endpoint
router.post('/analyze-resume', upload.single('resume'), analyzeResume);

// Chatbot endpoint
router.post('/chatbot', chatbot);

export default router; 