import OpenAI from "openai";
import { logger } from "./logger.js";

export interface AIConfig {
  apiKey?: string;
  baseURL: string;
  model: string;
  sttModel: string;
  providerName: string;
}

export function getAiConfig(): AIConfig {
  // Exclusively use GROK_API_KEY or GROQ_API_KEY
  const apiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;

  const validApiKey =
    apiKey && apiKey !== "your_grok_api_key_here" ? apiKey : undefined;

  const rawBaseURL =
    process.env.GROK_BASE_URL ||
    process.env.GROQ_BASE_URL;

  const isGroqKey = Boolean(validApiKey?.startsWith("gsk_"));
  const isXaiKey = Boolean(validApiKey?.startsWith("xai-"));

  let baseURL = rawBaseURL;
  let providerName = "Grok Engine";
  let defaultModel = "grok-2-latest";
  let sttModel = "whisper-large-v3";

  if (isGroqKey || rawBaseURL?.includes("groq.com")) {
    baseURL = baseURL || "https://api.groq.com/openai/v1";
    providerName = "Groq Cloud Engine";
    defaultModel = "llama-3.3-70b-versatile";
    sttModel = "whisper-large-v3";
  } else if (isXaiKey || rawBaseURL?.includes("xai.com")) {
    baseURL = baseURL || "https://api.xai.com/v1";
    providerName = "xAI Grok Engine";
    defaultModel = "grok-2-latest";
    sttModel = "whisper-1";
  } else {
    // Default base URL for Grok/Groq keys if not specified
    if (validApiKey?.startsWith("gsk_")) {
      baseURL = "https://api.groq.com/openai/v1";
      providerName = "Groq Cloud Engine";
      defaultModel = "llama-3.3-70b-versatile";
      sttModel = "whisper-large-v3";
    } else {
      baseURL = baseURL || "https://api.xai.com/v1";
      providerName = "xAI Grok Engine";
      defaultModel = "grok-2-latest";
      sttModel = "whisper-1";
    }
  }

  const rawModel =
    process.env.GROK_MODEL ||
    process.env.GROQ_MODEL ||
    process.env.MODEL;

  let model = rawModel || defaultModel;

  // Auto-map model name if using a Groq key (gsk_) with xAI model name (grok-*)
  if ((isGroqKey || baseURL.includes("groq.com")) && (model.startsWith("grok") || model === "grok-2-latest")) {
    model = "llama-3.3-70b-versatile";
  }

  return {
    apiKey: validApiKey,
    baseURL,
    model,
    sttModel,
    providerName,
  };
}

export function createAiClient(): OpenAI | null {
  const config = getAiConfig();
  if (!config.apiKey) {
    return null;
  }

  logger.info(
    `Initializing Grok Engine [Provider: ${config.providerName}, Model: ${config.model}, BaseURL: ${config.baseURL}]`
  );

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}
