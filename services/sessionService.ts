import { Message, MessageRole, SessionState } from '../types';

/**
 * InMemorySessionService (Enhanced with LocalStorage)
 */
const STORAGE_KEY = 'crawl4ai_validator_sessions';

class InMemorySessionService {
  private sessions: Map<string, Message[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.keys(parsed).forEach(key => {
          this.sessions.set(key, parsed[key]);
        });
      }
    } catch (e) {
      console.warn("Failed to load session history from localStorage", e);
    }
  }

  private saveToStorage() {
    try {
      const obj = Object.fromEntries(this.sessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn("Failed to save session history to localStorage", e);
    }
  }

  public createSession(): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, []);
    this.saveToStorage();
    return sessionId;
  }

  public getHistory(sessionId: string): Message[] {
    return this.sessions.get(sessionId) || [];
  }

  public addMessage(sessionId: string, message: Message): void {
    const history = this.getHistory(sessionId);
    history.push(message);
    this.sessions.set(sessionId, history);
    this.saveToStorage();
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.saveToStorage();
  }
}

export const sessionService = new InMemorySessionService();