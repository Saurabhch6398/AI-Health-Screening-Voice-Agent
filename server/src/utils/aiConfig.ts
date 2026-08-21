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
  // Support OPENAI_API_KEY as primary, fallback to GROK_API_KEY/GROk_API_KEY/GROQ_API_KEY
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.GROk_API_KEY ||
    process.env.GROQ_API_KEY;

  const validApiKey =
    apiKey &&
    apiKey !== "your_openai_api_key_here" &&
    apiKey !== "your_grok_api_key_here"
      ? apiKey
      : undefined;

  const rawBaseURL =
    process.env.OPENAI_BASE_URL ||
    process.env.GROK_BASE_URL ||
    process.env.GROQ_BASE_URL;

  const isOpenAIKey = Boolean(validApiKey?.startsWith("sk-") || process.env.OPENAI_API_KEY);
  const isGroqKey = Boolean(validApiKey?.startsWith("gsk_"));
  const isXaiKey = Boolean(validApiKey?.startsWith("xai-"));

  let baseURL = rawBaseURL;
  let providerName = "OpenAI Cloud Engine";
  let defaultModel = "gpt-4o-mini";
  let sttModel = "whisper-1";

  if (isOpenAIKey && !isGroqKey && !isXaiKey) {
    baseURL = baseURL || "https://api.openai.com/v1";
    providerName = "OpenAI Cloud Engine";
    defaultModel = "gpt-4o-mini";
    sttModel = "whisper-1";
  } else if (isGroqKey || rawBaseURL?.includes("groq.com")) {
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
    // Default fallback based on key prefix
    if (validApiKey?.startsWith("gsk_")) {
      baseURL = "https://api.groq.com/openai/v1";
      providerName = "Groq Cloud Engine";
      defaultModel = "llama-3.3-70b-versatile";
      sttModel = "whisper-large-v3";
    } else if (validApiKey?.startsWith("xai-")) {
      baseURL = "https://api.xai.com/v1";
      providerName = "xAI Grok Engine";
      defaultModel = "grok-2-latest";
      sttModel = "whisper-1";
    } else {
      baseURL = baseURL || "https://api.openai.com/v1";
      providerName = "OpenAI Cloud Engine";
      defaultModel = "gpt-4o-mini";
      sttModel = "whisper-1";
    }
  }

  let rawModel = process.env.MODEL;
  if (isOpenAIKey && !isGroqKey && !isXaiKey) {
    rawModel = process.env.OPENAI_MODEL || process.env.MODEL;
  } else if (isGroqKey) {
    rawModel = process.env.GROQ_MODEL || process.env.GROK_MODEL || process.env.MODEL;
  } else if (isXaiKey) {
    rawModel = process.env.GROK_MODEL || process.env.MODEL;
  }

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

export interface STTConfig {
  apiKey?: string;
  baseURL: string;
  sttModel: string;
  providerName: string;
}

export function getSttConfig(): STTConfig {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== "your_groq_api_key_here") {
    return {
      apiKey: groqKey,
      baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      sttModel: process.env.STT_MODEL || "whisper-large-v3",
      providerName: "Groq Cloud Engine",
    };
  }

  // Fallback to primary AI config
  const primaryConfig = getAiConfig();
  return {
    apiKey: primaryConfig.apiKey,
    baseURL: primaryConfig.baseURL,
    sttModel: primaryConfig.sttModel,
    providerName: primaryConfig.providerName,
  };
}

export function createAiClient(): OpenAI | null {
  const config = getAiConfig();
  if (!config.apiKey) {
    return null;
  }

  logger.info(
    `Initializing AI Client [Provider: ${config.providerName}, Model: ${config.model}, BaseURL: ${config.baseURL}]`
  );

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

export function createSttClient(): OpenAI | null {
  const config = getSttConfig();
  if (!config.apiKey) {
    return null;
  }

  logger.info(
    `Initializing STT Client [Provider: ${config.providerName}, Model: ${config.sttModel}, BaseURL: ${config.baseURL}]`
  );

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}
