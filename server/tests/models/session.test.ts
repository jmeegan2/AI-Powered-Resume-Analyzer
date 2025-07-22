import { sessionManager } from '../../models/session';
import { SessionData } from '../../models/analysis';

describe('SessionManager', () => {
  const sessionId = 'test-session-id';
  const mockSession: SessionData = {
    analysis: {
      missing_keywords: ['Python'],
      present_keywords: ['JavaScript'],
      recommendations: ['Add Python experience'],
      match_score: 70,
      summary: 'Decent match.'
    },
    resumeText: 'Resume text',
    jobDescription: 'Job description',
    timestamp: Date.now()
  };

  afterEach(() => {
    sessionManager.deleteSession(sessionId);
  });

  it('should set and get a session', () => {
    sessionManager.setSession(sessionId, mockSession);
    const retrieved = sessionManager.getSession(sessionId);
    expect(retrieved).toEqual(mockSession);
  });

  it('should delete a session', () => {
    sessionManager.setSession(sessionId, mockSession);
    const deleted = sessionManager.deleteSession(sessionId);
    expect(deleted).toBe(true);
    expect(sessionManager.getSession(sessionId)).toBeUndefined();
  });

  it('should clean up old sessions', () => {
    const oldSessionId = 'old-session';
    const oldSession: SessionData = {
      ...mockSession,
      timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    };
    sessionManager.setSession(oldSessionId, oldSession);
    sessionManager.cleanupOldSessions();
    expect(sessionManager.getSession(oldSessionId)).toBeUndefined();
  });

  it('should generate a unique session ID', () => {
    const id1 = sessionManager.generateSessionId();
    const id2 = sessionManager.generateSessionId();
    expect(id1).not.toEqual(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });
});