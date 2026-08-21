import OpenAI from "openai";
import { CallSession, HealthScreeningState, NextAction, CallState } from "../types/health.js";
import { HEALTH_AGENT_SYSTEM_PROMPT, buildAgentUserPrompt } from "../prompts/healthAgent.prompt.js";
import { SessionManager } from "../session/sessionManager.js";
import { createAiClient, getAiConfig } from "../utils/aiConfig.js";
import { logger } from "../utils/logger.js";

export interface ConversationResult {
  success: boolean;
  message: string;
  state: HealthScreeningState;
  nextAction: NextAction;
  callState: CallState;
  error?: string;
}

export class ConversationService {
  private openai: OpenAI | null = null;
  private model: string;
  private sessionManager: SessionManager;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
    const config = getAiConfig();
    this.model = config.model;
    this.openai = createAiClient();

    if (!this.openai) {
      logger.warn("ConversationService: API key is missing or not configured.");
    }
  }

  public getInitialGreeting(language: "en" | "hi" | "auto" = "en"): { message: string; state: HealthScreeningState } {
    let greeting =
      "Hello, I'm your AI health screening assistant. I'll ask you a few basic questions to better understand your concern. Please note that I cannot provide a diagnosis. To begin, could you please tell me your name?";

    if (language === "hi") {
      greeting = "नमस्ते, मैं आपका एआई स्वास्थ्य जांच सहायक हूँ। मैं आपकी समस्या को बेहतर ढंग से समझने के लिए आपसे कुछ बुनियादी सवाल पूछूँगा। कृपया ध्यान दें कि मैं कोई चिकित्सा निदान प्रदान नहीं कर सकता। शुरू करने के लिए, क्या आप मुझे अपना नाम बता सकते हैं?";
    } else if (language === "auto") {
      greeting = "Hello, I'm your AI health screening assistant. I will ask you a few basic questions. To begin, could you please tell me your name? आप अपना नाम हिंदी या अंग्रेजी में बता सकते हैं।";
    }

    return {
      message: greeting,
      state: {
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
      },
    };
  }

  public async processTurn(session: CallSession, userTranscript: string): Promise<ConversationResult> {
    // 1. Add user message to history
    this.sessionManager.addMessage(session.id, "user", userTranscript);

    if (!this.openai) {
      const fallbackMsg =
        "Thank you for sharing that. (Note: API Key is missing on the server. Please configure OPENAI_API_KEY or GROK_API_KEY to enable AI reasoning.)";
      this.sessionManager.addMessage(session.id, "assistant", fallbackMsg);
      return {
        success: true,
        message: fallbackMsg,
        state: session.healthData,
        nextAction: "continue",
        callState: session.callState,
      };
    }

    try {
      const systemPrompt = HEALTH_AGENT_SYSTEM_PROMPT;
      const userPrompt = buildAgentUserPrompt(session.healthData, session.callState, session.language, userTranscript);

      logger.info(`Sending conversation payload to ${this.model} (Session ${session.id}, State: ${session.callState}, Lang: ${session.language})...`);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      let rawContent = completion.choices[0]?.message?.content || "";
      logger.debug("Raw LLM completion response:", rawContent);

      // Strip markdown code block fences if present
      rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

      const parsed = JSON.parse(rawContent);

      const responseText = parsed.response || "Thank you. Could you tell me more about how you are feeling?";
      const extractedData = parsed.extractedData || {};
      const nextAction: NextAction = parsed.nextAction || "continue";
      const newCallState: CallState = parsed.callState || session.callState;

      // Update callState in session
      session.callState = newCallState;
      if (extractedData.screeningComplete === true || nextAction === "complete") {
        session.callState = "COMPLETED";
        extractedData.screeningComplete = true;
      } else if (nextAction === "escalate") {
        session.callState = "EMERGENCY";
      }

      // Update structured state
      const updatedState = this.sessionManager.updateHealthState(session.id, extractedData) || session.healthData;

      // Add assistant response to history
      this.sessionManager.addMessage(session.id, "assistant", responseText);

      return {
        success: true,
        message: responseText,
        state: updatedState,
        nextAction,
        callState: session.callState,
      };
    } catch (error: any) {
      logger.error("ConversationService error:", error?.message || error);

      // Safe fallback response based on selected language
      const fallbackMsg =
        session.language === "hi"
          ? "मुझे खेद है, मुझे उस प्रतिक्रिया को संसाधित करने में समस्या हुई। क्या आप कृपया अपनी बात दोहरा सकते हैं?"
          : "I'm sorry, I had trouble processing that response. Could you please repeat what you said?";
      this.sessionManager.addMessage(session.id, "assistant", fallbackMsg);

      return {
        success: false,
        message: fallbackMsg,
        state: session.healthData,
        nextAction: "continue",
        callState: session.callState,
        error: error?.message || "Failed to process LLM request.",
      };
    }
  }
}
