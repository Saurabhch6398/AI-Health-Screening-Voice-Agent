import { Server, Socket } from "socket.io";
import { SessionManager } from "../session/sessionManager.js";
import { SpeechToTextService } from "../services/speechToText.service.js";
import { ConversationService } from "../services/conversation.service.js";
import { TextToSpeechService } from "../services/textToSpeech.service.js";
import { ReportService } from "../services/report.service.js";
import { StartCallPayload, UserAudioPayload, EndCallPayload } from "../types/health.js";
import { logger } from "../utils/logger.js";

export function registerCallHandlers(
  io: Server,
  socket: Socket,
  services: {
    sttService: SpeechToTextService;
    conversationService: ConversationService;
    ttsService: TextToSpeechService;
    reportService: ReportService;
  }
) {
  const sessionManager = SessionManager.getInstance();
  const { sttService, conversationService, ttsService, reportService } = services;

  logger.info(`Socket client connected: ${socket.id}`);

  socket.on("start_call", async (payload: StartCallPayload) => {
    const { sessionId } = payload;
    logger.info(`[Socket ${socket.id}] start_call received for session: ${sessionId}`);

    socket.emit("call_status", { status: "connecting" });

    try {
      const session = sessionManager.createSession(sessionId);
      const greeting = conversationService.getInitialGreeting();
      sessionManager.addMessage(session.id, "assistant", greeting.message);

      const ttsResult = await ttsService.generateSpeech(greeting.message);

      socket.emit("call_started", {
        sessionId: session.id,
        assistantMessage: greeting.message,
        audio: ttsResult.audioBase64,
      });

      socket.emit("call_status", { status: "speaking" });
    } catch (error: any) {
      logger.error(`Error in start_call for session ${sessionId}:`, error);
      socket.emit("call_error", {
        code: "START_CALL_FAILED",
        message: "Failed to initialize call session.",
        recoverable: true,
      });
      socket.emit("call_status", { status: "error" });
    }
  });

  socket.on("user_audio", async (payload: UserAudioPayload) => {
    const { sessionId, audio, mimeType } = payload;
    logger.info(`[Socket ${socket.id}] user_audio received for session: ${sessionId}`);

    const session = sessionManager.getSession(sessionId);
    if (!session || session.status === "ended") {
      logger.warn(`Session ${sessionId} not found or ended.`);
      socket.emit("call_error", {
        code: "SESSION_NOT_FOUND",
        message: "Session is inactive or not found.",
        recoverable: false,
      });
      socket.emit("call_status", { status: "error" });
      return;
    }

    socket.emit("call_status", { status: "processing" });

    try {
      let audioBuffer: Buffer;
      if (Buffer.isBuffer(audio)) {
        audioBuffer = audio;
      } else if (audio instanceof ArrayBuffer) {
        audioBuffer = Buffer.from(audio);
      } else if (typeof audio === "string") {
        const base64Data = audio.includes("base64,") ? audio.split("base64,")[1] : audio;
        audioBuffer = Buffer.from(base64Data, "base64");
      } else {
        audioBuffer = Buffer.from(audio as any);
      }

      const sttResult = await sttService.transcribeAudio(audioBuffer, mimeType);

      if (!sttResult.success) {
        if (sttResult.reason === "NO_SPEECH") {
          socket.emit("call_error", {
            code: "NO_SPEECH",
            message: "I didn't catch that. Please try speaking again.",
            recoverable: true,
          });
        } else {
          socket.emit("call_error", {
            code: "STT_FAILED",
            message: sttResult.message || "Sorry, I had trouble understanding the audio. Please try again.",
            recoverable: true,
          });
        }
        socket.emit("call_status", { status: "listening" });
        return;
      }

      const userTranscript = sttResult.transcript || "";
      logger.info(`User transcript: "${userTranscript}"`);
      socket.emit("user_transcript", { transcript: userTranscript });

      const convResult = await conversationService.processTurn(session, userTranscript);
      const ttsResult = await ttsService.generateSpeech(convResult.message);

      socket.emit("assistant_response", {
        message: convResult.message,
        audio: ttsResult.audioBase64,
        state: convResult.state,
        nextAction: convResult.nextAction,
      });

      socket.emit("call_status", { status: "speaking" });
    } catch (error: any) {
      logger.error(`Error processing user_audio for session ${sessionId}:`, error);
      socket.emit("call_error", {
        code: "PROCESSING_FAILED",
        message: "An unexpected error occurred while processing your speech.",
        recoverable: true,
      });
      socket.emit("call_status", { status: "listening" });
    }
  });

  socket.on("end_call", async (payload: EndCallPayload) => {
    const { sessionId } = payload;
    logger.info(`[Socket ${socket.id}] end_call received for session: ${sessionId}`);

    socket.emit("call_status", { status: "ending" });

    try {
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        logger.warn(`End call requested for unknown session ${sessionId}`);
        socket.emit("call_error", {
          code: "SESSION_NOT_FOUND",
          message: "Could not find call session to summarize.",
          recoverable: false,
        });
        socket.emit("call_status", { status: "ended" });
        return;
      }

      sessionManager.endSession(sessionId);

      const report = await reportService.generateReport(session);

      socket.emit("call_report", { report });
      socket.emit("call_status", { status: "ended" });
    } catch (error: any) {
      logger.error(`Error generating report for session ${sessionId}:`, error);
      socket.emit("call_error", {
        code: "REPORT_FAILED",
        message: "Failed to generate health summary report.",
        recoverable: true,
      });
      socket.emit("call_status", { status: "ended" });
    }
  });

  socket.on("disconnect", () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
}
