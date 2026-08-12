import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import { createAiClient, getAiConfig } from "../utils/aiConfig.js";

export interface TTSResult {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}

export class TextToSpeechService {
  private openai: OpenAI | null = null;

  constructor() {
    this.openai = createAiClient();
    if (!this.openai) {
      logger.warn("TextToSpeechService: Grok API key is not configured.");
    }
  }

  public async generateSpeech(text: string): Promise<TTSResult> {
    if (!this.openai) {
      return {
        success: false,
        error: "API key is missing on server.",
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "Text for speech synthesis is empty.",
      };
    }

    try {
      logger.info(`Attempting TTS speech synthesis for text: "${text.substring(0, 40)}..."`);

      const mp3 = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64 = buffer.toString("base64");
      const audioDataUrl = `data:audio/mp3;base64,${base64}`;

      logger.info(`TTS audio generated successfully (${buffer.length} bytes).`);
      return {
        success: true,
        audioBase64: audioDataUrl,
        mimeType: "audio/mp3",
      };
    } catch (error: any) {
      logger.info(`[TTS] Backend TTS (tts-1) endpoint not available on current provider (${error?.message || "Model not found"}). Client Web Speech API will handle audio output.`);
      return {
        success: false,
        error: "NO_TTS_ENDPOINT",
      };
    }
  }
}
