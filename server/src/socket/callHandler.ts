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
    const { sessionId, language } = payload;
    const selectedLanguage = language || "en";
    logger.info(`[Socket ${socket.id}] start_call received for session: ${sessionId}, language: ${selectedLanguage}`);

    socket.emit("call_status", { status: "connecting" });

    try {
      const session = sessionManager.createSession(sessionId, selectedLanguage);
      const greeting = conversationService.getInitialGreeting(selectedLanguage);
      sessionManager.addMessage(session.id, "assistant", greeting.message);

      const ttsResult = await ttsService.generateSpeech(greeting.message);

      socket.emit("call_started", {
        sessionId: session.id,
        assistantMessage: greeting.message,
        audio: ttsResult.audioBase64,
        callState: session.callState,
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

      // Pass the session language to the transcription service
      const sttResult = await sttService.transcribeAudio(audioBuffer, mimeType, session.language);

      if (!sttResult.success) {
        let errorMsg = "Sorry, I had trouble understanding the audio. Please try again.";
        if (sttResult.reason === "NO_SPEECH") {
          errorMsg = session.language === "hi"
            ? "मुझे आपकी आवाज़ सुनाई नहीं दी। कृपया फिर से बोलें।"
            : "I didn't catch that. Please try speaking again.";
        } else if (session.language === "hi") {
          errorMsg = "मुझे समझने में कुछ समस्या हुई। कृपया फिर से प्रयास करें।";
        }

        logger.warn(`STT failed for session ${sessionId}: ${sttResult.reason}. Speaking failure response.`);
        const ttsResult = await ttsService.generateSpeech(errorMsg);

        // Speak the error message back to keep the conversation going
        socket.emit("assistant_response", {
          message: errorMsg,
          audio: ttsResult.audioBase64,
          state: session.healthData,
          nextAction: "continue",
          callState: session.callState,
          isSpeechError: true,
        });

        socket.emit("call_error", {
          code: sttResult.reason || "STT_FAILED",
          message: errorMsg,
          recoverable: true,
        });

        socket.emit("call_status", { status: "speaking" });
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
        callState: convResult.callState,
      });

      socket.emit("call_status", { status: "speaking" });
    } catch (error: any) {
      logger.error(`Error processing user_audio for session ${sessionId}:`, error);
      
      const errMessage = session.language === "hi"
        ? "मुझे आपकी बात संसाधित करने में समस्या हो रही है। कृपया पुनः प्रयास करें।"
        : "An unexpected error occurred while processing your speech. Please try again.";
      
      let ttsResult: any = { success: false };
      try {
        ttsResult = await ttsService.generateSpeech(errMessage);
      } catch (ttsErr) {
        logger.error("Error generating speech for processing error:", ttsErr);
      }
      
      socket.emit("assistant_response", {
        message: errMessage,
        audio: ttsResult.audioBase64,
        state: session.healthData,
        nextAction: "continue",
        callState: session.callState,
      });

      socket.emit("call_error", {
        code: "PROCESSING_FAILED",
        message: errMessage,
        recoverable: true,
      });
      socket.emit("call_status", { status: "speaking" });
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
