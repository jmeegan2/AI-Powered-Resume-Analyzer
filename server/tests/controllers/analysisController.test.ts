import { analyzeResume } from "../../controllers/analysisController";
import * as analysisService from "../../services/analysisService";

describe('', () => {
    it('should return 400 if jobDescription or resume file is missing', async () => {
        // Mock req and res objects
        const req = { body: {}, file: null } as any;

        /*
        You are creating a fake function (a "mock") that you can then monitor to see what arguments 
        it was called with, how many times it was called, and in what order.
        */

        const res = {
            status: jest.fn().mockReturnThis(), //returns this
            json: jest.fn() //chained to status 
        } as any

        //understand mocks 

        await analyzeResume(req, res)
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Both job description and resume file are required'
        });
    });

    it('should return success with analysis and sessionId', async () => {
        // Arrange: mock req and res
        const req = { 
            body: { jobDescription: "Software Engineer" }, 
            file: { buffer: Buffer.from("resume content"), mimetype: "text/plain" } 
        } as any;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

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
});