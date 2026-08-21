import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  CallStatus,
  ConversationMessage,
  HealthScreeningState,
  HealthReport,
  ErrorMessageData,
  NextAction,
  CallState,
} from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const initialHealthState: HealthScreeningState = {
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
};

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [healthState, setHealthState] = useState<HealthScreeningState>(initialHealthState);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<ErrorMessageData | null>(null);
  const [latestAudio, setLatestAudio] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>("GREETING");

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      autoConnect: true,
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("[Socket] Connected to server:", s.id);
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
      setIsConnected(false);
    });

    s.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err);
      setIsConnected(false);
      setError({
        code: "CONNECTION_ERROR",
        message: "Failed to connect to server. Please check if the backend is running.",
        recoverable: true,
      });
    });

    s.on("call_status", (data: { status: CallStatus }) => {
      console.log("[Socket] Status update:", data.status);
      setStatus(data.status);
    });

    s.on("call_started", (data: { sessionId: string; assistantMessage: string; audio?: string; callState?: CallState }) => {
      console.log("[Socket] Call started:", data.sessionId);
      setSessionId(data.sessionId);
      setError(null);
      if (data.callState) {
        setCallState(data.callState);
      }

      const msg: ConversationMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.assistantMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages([msg]);

      if (data.audio) {
        setLatestAudio(data.audio);
      }
    });

    s.on("user_transcript", (data: { transcript: string }) => {
      if (!data.transcript) return;
      console.log("[Socket] User transcript:", data.transcript);
      const msg: ConversationMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: data.transcript,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
    });

    s.on(
      "assistant_response",
      (data: { message: string; audio?: string; state: HealthScreeningState; nextAction: NextAction; callState?: CallState }) => {
        console.log("[Socket] Assistant response:", data.message);
        const msg: ConversationMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);

        if (data.state) {
          setHealthState(data.state);
        }

        if (data.callState) {
          setCallState(data.callState);
        }

        if (data.audio) {
          setLatestAudio(data.audio);
        }
      }
    );

    s.on("call_report", (data: { report: HealthReport }) => {
      console.log("[Socket] Call report received:", data.report);
      setReport(data.report);
    });

    s.on("call_error", (data: ErrorMessageData) => {
      console.warn("[Socket] Call error:", data);
      setError(data);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, []);

  const startCall = useCallback((language: "en" | "hi" | "auto" = "en") => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newSessionId);
    setMessages([]);
    setHealthState(initialHealthState);
    setCallState("GREETING");
    setReport(null);
    setError(null);
    setLatestAudio(null);
    setStatus("connecting");

    if (socketRef.current) {
      socketRef.current.emit("start_call", { sessionId: newSessionId, language });
    }
  }, []);

  const sendUserAudio = useCallback(
    (audioBlob: Blob, mimeType: string) => {
      if (!socketRef.current || !sessionId) return;

      setStatus("processing");
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        socketRef.current?.emit("user_audio", {
          sessionId,
          audio: arrayBuffer,
          mimeType,
        });
      };
      reader.readAsArrayBuffer(audioBlob);
    },
    [sessionId]
  );

  const endCall = useCallback(() => {
    if (!socketRef.current || !sessionId) return;
    setStatus("ending");
    socketRef.current.emit("end_call", { sessionId });
  }, [sessionId]);

  const resetCall = useCallback(() => {
    setStatus("idle");
    setSessionId(null);
    setMessages([]);
    setHealthState(initialHealthState);
    setCallState("GREETING");
    setReport(null);
    setError(null);
    setLatestAudio(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    status,
    setStatus,
    sessionId,
    messages,
    healthState,
    callState,
    report,
    error,
    latestAudio,
    startCall,
    sendUserAudio,
    endCall,
    resetCall,
    clearError,
  };
}
