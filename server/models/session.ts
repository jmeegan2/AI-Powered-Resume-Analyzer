import { SessionData } from './analysis';

// In-memory session storage (in production, use Redis or database)
class SessionManager {
  private sessions = new Map<string, SessionData>();

  // Get session data
  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  // Set session data
  setSession(sessionId: string, sessionData: SessionData): void {
    this.sessions.set(sessionId, sessionData);
  }

  // Delete session data
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Clean up old sessions (older than 24 hours)
  cleanupOldSessions(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (now - sessionData.timestamp > oneDay) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Generate new session ID
  generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager(); 