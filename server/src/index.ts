import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { getAiConfig } from "./utils/aiConfig.js";
import { SpeechToTextService } from "./services/speechToText.service.js";
import { ConversationService } from "./services/conversation.service.js";
import { TextToSpeechService } from "./services/textToSpeech.service.js";
import { ReportService } from "./services/report.service.js";
import { registerCallHandlers } from "./socket/callHandler.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  const config = getAiConfig();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "AI Health Screening Server",
    hasApiKey: Boolean(config.apiKey),
    provider: config.providerName,
    model: config.model,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e7,
});

const sttService = new SpeechToTextService();
const conversationService = new ConversationService();
const ttsService = new TextToSpeechService();
const reportService = new ReportService();

io.on("connection", (socket) => {
  registerCallHandlers(io, socket, {
    sttService,
    conversationService,
    ttsService,
    reportService,
  });
});

server.listen(PORT, () => {
  const config = getAiConfig();
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Allowed CORS origin: ${CLIENT_URL}`);
  
  if (!config.apiKey) {
    logger.warn("GROK_API_KEY is not set in environment variables.");
  } else {
    logger.info(`AI Provider: ${config.providerName} [Model: ${config.model}]`);
  }
});
