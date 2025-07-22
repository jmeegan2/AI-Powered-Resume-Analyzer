// Test file for chatbotController 
import { chatbot } from '../../controllers/chatbotController';
import * as chatbotService from '../../services/chatbotService';

function mockReq(body: any = {}) {
    return { body } as any;
}

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as any;
}

describe('chatbot controller', () => {
    let res: any;
    beforeEach(() => {
        res = mockRes();
    });

    it('should return 500 if message is missing', async () => {
        const req = mockReq({});
        await chatbot(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to generate response from chatbot.',
            details: 'Message is required and must be a non-empty string.'
        });
    });

    it('should return 500 if message is empty', async () => {
        const req = mockReq({ message: '' });
        await chatbot(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to generate response from chatbot.',
            details: 'Message is required and must be a non-empty string.'
        });
    });

    it('should return success with chatbot response', async () => {
        const req = mockReq({ message: 'Hello' });
        jest.spyOn(chatbotService, 'handleChatbotRequest').mockResolvedValue('Hi there!');
        await chatbot(req, res);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: 'Hi there!'
        });
    });

    it('should return success with chatbot response and sessionId', async () => {
        const req = mockReq({ message: 'Hello', sessionId: 'abc123' });
        jest.spyOn(chatbotService, 'handleChatbotRequest').mockResolvedValue('Hi with context!');
        await chatbot(req, res);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: 'Hi with context!'
        });
    });

    it('should return 500 if handleChatbotRequest throws an error', async () => {
        const req = mockReq({ message: 'Hello' });
        jest.spyOn(chatbotService, 'handleChatbotRequest').mockRejectedValue(new Error('Service error'));
        await chatbot(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Failed to generate response from chatbot.',
            details: 'Service error'
        });
    });
});