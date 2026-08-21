export interface HealthScreeningState {
  name: string | null;
  mainConcern: string | null;
  duration: string | null;
  severity: string | null;
  relatedSymptoms: string[];
  medications: string[];
  allergies: string[];
  relevantMedicalHistory: string[];
  redFlags: string[];
  screeningComplete: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type CallState = "GREETING" | "COLLECTING" | "FOLLOW_UP" | "COMPLETED" | "EMERGENCY";

export interface CallSession {
  id: string;
  status: "active" | "ended";
  createdAt: string;
  messages: ConversationMessage[];
  healthData: HealthScreeningState;
  callState: CallState;
  language: "en" | "hi" | "auto";
}


export interface HealthReport {
  screeningStatus: "complete" | "partial" | "limited";
  patientName: string | null;
  mainConcern: string | null;
  duration: string | null;
  severity: string | null;
  keySymptoms: string[];
  medications: string[];
  allergies: string[];
  relevantHistory: string[];
  followUpFlags: string[];
  summary: string;
  informationMissing: string[];
  disclaimer: string;
}

export type CallStatusType =
  | "idle"
  | "connecting"
  | "listening"
  | "recording"
  | "processing"
  | "speaking"
  | "ending"
  | "ended"
  | "error";

export type NextAction = "continue" | "clarify" | "complete" | "escalate";

export interface StartCallPayload {
  sessionId: string;
  language?: "en" | "hi" | "auto";
}

export interface UserAudioPayload {
  sessionId: string;
  audio: ArrayBuffer | Buffer | string;
  mimeType: string;
}

export interface EndCallPayload {
  sessionId: string;
}

export interface CallStartedPayload {
  sessionId: string;
  assistantMessage: string;
  audio?: string;
}

export interface UserTranscriptPayload {
  transcript: string;
}

export interface AssistantResponsePayload {
  message: string;
  audio?: string;
  state: HealthScreeningState;
  nextAction: NextAction;
}

export interface CallReportPayload {
  report: HealthReport;
}

export interface CallErrorPayload {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface CallStatusPayload {
  status: CallStatusType;
}
