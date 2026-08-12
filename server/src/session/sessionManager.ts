import { CallSession, HealthScreeningState, ConversationMessage } from "../types/health.js";
import { logger } from "../utils/logger.js";

const createInitialState = (): HealthScreeningState => ({
  name: null,
  mainConcern: null,
  duration: null,
  severity: null,
  relatedSymptoms: [],
  medications: [],
  allergies: [],
  relevantMedicalHistory: [],
  redFlags: [],
  screeningComplete: false,
});

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, CallSession> = new Map();

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public createSession(id: string): CallSession {
    const session: CallSession = {
      id,
      status: "active",
      createdAt: new Date().toISOString(),
      messages: [],
      healthData: createInitialState(),
    };
    this.sessions.set(id, session);
    logger.info(`Session created: ${id}`);
    return session;
  }

  public getSession(id: string): CallSession | undefined {
    return this.sessions.get(id);
  }

  public addMessage(id: string, role: "user" | "assistant", content: string): ConversationMessage | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      logger.warn(`Attempted to add message to non-existent session: ${id}`);
      return undefined;
    }

    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(message);
    return message;
  }

  public updateHealthState(id: string, incomingData: Partial<HealthScreeningState>): HealthScreeningState | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      logger.warn(`Attempted to update state on non-existent session: ${id}`);
      return undefined;
    }

    const current = session.healthData;

    // Merge strategy: preserve previously gathered info, do not overwrite valid string with null
    const mergedName = incomingData.name && incomingData.name.trim() !== "" ? incomingData.name : current.name;
    const mergedMainConcern = incomingData.mainConcern && incomingData.mainConcern.trim() !== "" ? incomingData.mainConcern : current.mainConcern;
    const mergedDuration = incomingData.duration && incomingData.duration.trim() !== "" ? incomingData.duration : current.duration;
    const mergedSeverity = incomingData.severity && incomingData.severity.trim() !== "" ? incomingData.severity : current.severity;

    const mergeArrays = (existing: string[], incoming?: string[]): string[] => {
      if (!incoming || !Array.isArray(incoming)) return existing;
      const combined = [...existing, ...incoming];
      return Array.from(new Set(combined.map((item) => item.trim()).filter((item) => item.length > 0)));
    };

    session.healthData = {
      name: mergedName,
      mainConcern: mergedMainConcern,
      duration: mergedDuration,
      severity: mergedSeverity,
      relatedSymptoms: mergeArrays(current.relatedSymptoms, incomingData.relatedSymptoms),
      medications: mergeArrays(current.medications, incomingData.medications),
      allergies: mergeArrays(current.allergies, incomingData.allergies),
      relevantMedicalHistory: mergeArrays(current.relevantMedicalHistory, incomingData.relevantMedicalHistory),
      redFlags: mergeArrays(current.redFlags, incomingData.redFlags),
      screeningComplete: incomingData.screeningComplete === true ? true : current.screeningComplete,
    };

    logger.debug(`Session ${id} state updated:`, session.healthData);
    return session.healthData;
  }

  public endSession(id: string): CallSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.status = "ended";
      logger.info(`Session ended: ${id}`);
    }
    return session;
  }

  public deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      logger.info(`Session deleted: ${id}`);
    }
    return deleted;
  }
}
