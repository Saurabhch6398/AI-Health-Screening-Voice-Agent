import OpenAI, { toFile } from "openai";
import { logger } from "../utils/logger.js";
import { createAiClient, getAiConfig } from "../utils/aiConfig.js";

export interface STTResult {
  success: boolean;
  transcript?: string;
  reason?: "NO_SPEECH" | "STT_ERROR" | "NO_API_KEY";
  message?: string;
}

export class SpeechToTextService {
  private openai: OpenAI | null = null;
  private sttModel: string;

  constructor() {
    const config = getAiConfig();
    this.sttModel = config.sttModel;
    this.openai = createAiClient();

    if (!this.openai) {
      logger.warn("SpeechToTextService: GROK_API_KEY is not configured.");
    }
  }

  public async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = "audio/webm"
  ): Promise<STTResult> {
    if (!this.openai) {
      return {
        success: false,
        reason: "NO_API_KEY",
        message: "Grok API key is missing or not configured on the server.",
      };
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return {
        success: false,
        reason: "NO_SPEECH",
        message: "Empty audio buffer received.",
      };
    }

    try {
      let extension = "webm";
      if (mimeType.includes("wav")) extension = "wav";
      else if (mimeType.includes("mp4") || mimeType.includes("m4a")) extension = "m4a";
      else if (mimeType.includes("ogg")) extension = "ogg";
      else if (mimeType.includes("mp3")) extension = "mp3";

      const file = await toFile(audioBuffer, `user_speech.${extension}`, {
        type: mimeType || "audio/webm",
      });

      logger.info(`Transcribing audio buffer (${audioBuffer.length} bytes, format: ${extension}, model: ${this.sttModel})...`);
      const transcription = await this.openai.audio.transcriptions.create({
        file,
        model: this.sttModel,
        prompt: "Health screening intake call transcript in English or Hindi (हिन्दी).",
      });

      const transcript = transcription.text ? transcription.text.trim() : "";

      if (!transcript || transcript.length === 0) {
        logger.info("SpeechToText: No speech recognized in audio buffer.");
        return {
          success: false,
          reason: "NO_SPEECH",
          message: "No clear speech was detected in the audio.",
        };
      }

      logger.info(`SpeechToText output: "${transcript}"`);
      return {
        success: true,
        transcript,
      };
    } catch (error: any) {
      logger.error("SpeechToText Error:", error?.message || error);
      return {
        success: false,
        reason: "STT_ERROR",
        message: error?.message || "Failed to process audio transcription with Grok Engine.",
      };
    }
  }
}
