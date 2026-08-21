export type CallStatus =
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

export type CallState = "GREETING" | "COLLECTING" | "FOLLOW_UP" | "COMPLETED" | "EMERGENCY";

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
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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

export interface ErrorMessageData {
  code: string;
  message: string;
  recoverable: boolean;
}
