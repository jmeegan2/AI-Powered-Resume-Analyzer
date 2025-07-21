import { analyzeResume } from "../../controllers/analysisController";
import * as analysisService from "../../services/analysisService";

function mockReq(body: any = {}, file: any = null) {
    return { body, file } as any;
}

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as any;
}

describe('', () => {
    let res: any;
    beforeEach(() => {
        res = mockRes();
    });

    it('should return 400 if jobDescription or resume file is missing', async () => {
        const req = mockReq();
        await analyzeResume(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Both job description and resume file are required'
        });
    });

    it('should return success with analysis and sessionId', async () => {
        const req = mockReq({ jobDescription: "Software Engineer" }, { buffer: Buffer.from("resume content"), mimetype: "text/plain" });

        // Mock processResumeAnalysis
        const fakeAnalysis = {
            analysis: {
                missing_keywords: ["React"],
                present_keywords: ["JavaScript"],
                recommendations: ["Add more React experience"],
                match_score: 80,
                summary: "Good match"
            },
            sessionId: "abc123"
        };
        jest.spyOn(analysisService, "processResumeAnalysis").mockResolvedValue(fakeAnalysis);

        // Act
        await analyzeResume(req, res);

        // Assert
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            analysis: fakeAnalysis.analysis,
            sessionId: fakeAnalysis.sessionId
        });
    });

    it('should return 400 if only jobDescription is missing', async () => {
        const req = mockReq({}, { buffer: Buffer.from('resume'), mimetype: 'text/plain' });
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Both job description and resume file are required' });
    });

    it('should return 400 if only resume file is missing', async () => {
        const req = mockReq({ jobDescription: 'desc' }, null);
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Both job description and resume file are required' });
    });

    it('should return 500 if processResumeAnalysis throws an error', async () => {
        const req = mockReq({ jobDescription: 'desc' }, { buffer: Buffer.from('resume'), mimetype: 'text/plain' });
        jest.spyOn(analysisService, 'processResumeAnalysis').mockRejectedValue(new Error('Service error'));
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyze resume', details: 'Service error' });
    });

    it('should return 500 if resume file type is not supported', async () => {
        const req = mockReq({ jobDescription: 'desc' }, { buffer: Buffer.from('resume'), mimetype: 'image/png' });
        jest.spyOn(analysisService, 'processResumeAnalysis').mockRejectedValue(new Error('Resume processing failed: Error: Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyze resume', details: 'Resume processing failed: Error: Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' });
    });

    it('should return 500 if resume file is empty', async () => {
        const req = mockReq({ jobDescription: 'desc' }, { buffer: Buffer.from(''), mimetype: 'text/plain' });
        jest.spyOn(analysisService, 'processResumeAnalysis').mockRejectedValue(new Error('Resume processing failed: Error: Resume file is empty'));
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to analyze resume', details: 'Resume processing failed: Error: Resume file is empty' });
    });

    it('should return 400 if job description is empty', async () => {
        const req = mockReq({ jobDescription: '' }, { buffer: Buffer.from('resume'), mimetype: 'text/plain' });
        await analyzeResume(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Both job description and resume file are required' });
    });
});