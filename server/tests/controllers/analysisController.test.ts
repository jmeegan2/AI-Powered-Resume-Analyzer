import { analyzeResume } from "../../controllers/analysisController";

describe.only('', () => {
    it('should return 400 if jobDescription or resume file is missing', async () => {
        // Mock req and res objects
        const req = { body: {}, file: null } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any

        await analyzeResume(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Both job description and resume file are required'
        });
    });
});