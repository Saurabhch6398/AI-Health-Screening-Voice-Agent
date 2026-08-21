import { getSttConfig } from "../utils/aiConfig.js";
import { logger } from "../utils/logger.js";

export interface STTResult {
  success: boolean;
  transcript?: string;
  reason?: "NO_SPEECH" | "STT_ERROR" | "NO_API_KEY";
  message?: string;
}

export class SpeechToTextService {
  private apiKey: string | undefined;
  private baseURL: string;
  private sttModel: string;

  constructor() {
    const config = getSttConfig();
    this.sttModel = config.sttModel;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;

    if (!this.apiKey) {
      logger.warn("SpeechToTextService: API key is not configured.");
    }
  }

  public async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = "audio/webm",
    targetLanguage: "en" | "hi" | "auto" = "en"
  ): Promise<STTResult> {
    if (!this.apiKey) {
      return {
        success: false,
        reason: "NO_API_KEY",
        message: "API key is missing or not configured on the server.",
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
      let cleanMimeType = "audio/webm";
      
      if (mimeType.includes("wav")) {
        extension = "wav";
        cleanMimeType = "audio/wav";
      } else if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
        extension = "m4a";
        cleanMimeType = "audio/m4a";
      } else if (mimeType.includes("ogg")) {
        extension = "ogg";
        cleanMimeType = "audio/ogg";
      } else if (mimeType.includes("mp3")) {
        extension = "mp3";
        cleanMimeType = "audio/mp3";
      }

      // Convert Node Buffer to standard Blob/File
      const audioBlob = new Blob([audioBuffer], { type: cleanMimeType });
      const formData = new FormData();
      formData.append("file", audioBlob, `user_speech.${extension}`);
      formData.append("model", this.sttModel);

      if (targetLanguage === "en") {
        formData.append("language", "en");
        formData.append("prompt", "Health screening intake call transcript in English.");
      } else if (targetLanguage === "hi") {
        formData.append("language", "hi");
        formData.append("prompt", "यह एक स्वास्थ्य जांच कॉल है। हिंदी बातचीत का प्रतिलेख।");
      } else {
        formData.append("prompt", "Bilingual healthcare screening intake call. Speech could be in English or Hindi / Hinglish.");
      }

      logger.info(`Transcribing audio buffer (${audioBuffer.length} bytes, format: ${extension}, model: ${this.sttModel}, targetLanguage: ${targetLanguage}) via fetch...`);
      
      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API returned status ${response.status}: ${errorText}`);
      }

      const transcription = await response.json() as { text: string };
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
        message: error?.message || "Failed to process audio transcription.",
      };
    }
  }
}
