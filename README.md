# AI Health Screening Voice Agent

A premium, interactive web application where users can conduct a live preliminary health screening call with a voice-based AI assistant. The app is built with a **React + TypeScript** frontend and a **Node.js + Express** backend, communicating in real-time over **WebSockets (Socket.io)**.

---

## 🏗️ Architecture Overview

The system uses a **turn-based voice conversation flow** (which is robust and network-resilient for web interfaces). 

```text
                     ┌──────────────────┐
                     │   React Client   │
                     │  (Vite + React)  │
                     └────────┬─────────┘
                              │
                        Socket.io (WS)
                              │
                     ┌────────▼─────────┐
                     │  Node.js Server  │
                     │  (Session State) │
                     └────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
      Speech-To-Text         LLM         Text-To-Speech
    (OpenAI Whisper /     (GPT-4o-mini /   (OpenAI TTS /
       Groq API)            Groq Llama)     Browser Fallback)
```

---

## 🌟 Key Features

### 1. Unified API Key Support (OpenAI + Groq)
- **OpenAI Engine (Primary)**: Set `OPENAI_API_KEY` in environment variables. The server will orchestrate Whisper STT (`whisper-1`), GPT-4o-mini for clinical logic, and OpenAI TTS (`tts-1`) for **high-fidelity natural sounding voice responses**.
- **Groq Cloud Engine (Fallback)**: Set `GROK_API_KEY` / `GROQ_API_KEY`. The server will execute STT via Groq (`whisper-large-v3`) and LLM via Groq (`llama-3.3-70b-versatile`). Since Groq does not support TTS, the app automatically leverages browser native SpeechSynthesis (`SpeechSynthesisUtterance`) on the client.

### 2. Bilingual Support & Auto Language Detection (Bonus)
- The app supports **English**, **हिन्दी (Hindi)**, and **Auto-Detect** mode.
- Users can toggle their preference before starting the call.
- In **Auto-Detect** mode, the Speech-to-Text model detects the spoken language dynamically. The LLM then replies matching the user's language (speaking Devanagari Hindi or English) and plays the matching localized audio.

### 3. Explicit Conversation State Machine
The agent tracks conversation context through explicit states to guarantee it never repeats questions or loses the thread:
- `GREETING`: Welcome the patient, state medical boundaries, and capture name.
- `COLLECTING`: Gather symptoms, duration, and pain severity (on a 1-10 scale).
- `FOLLOW_UP`: Ask about active medications, allergies, and historical conditions.
- `COMPLETED`: Finish screening, thank the patient, and trigger clinical report generation.
- `EMERGENCY`: Active warning state when critical health flags are triggered.

### 4. Emergency Safety Guardrails
- During transcribing, if the agent detects critical safety warning words (e.g., severe chest pain, extreme breathing difficulties, stroke indicators, uncontrolled bleeding), the conversation state immediately transitions to `EMERGENCY`.
- The assistant halts screening, calmly advises the user to call emergency services (like 102/112 in India, 911 in the US), and ceases asking intake questions.

### 5. Graceful Failure & Edge-Case Recovery
- **Silence/Empty Speech**: If Whisper registers no speech, the LLM is bypassed, and the assistant directly speaks: *"I didn't catch that. Please try speaking again."* (or Hindi equivalent), resetting to listening mode.
- **LLM API Errors**: Errors mid-turn trigger safe verbal fallbacks: *"I'm having trouble processing that response. Could you please try again?"*
- **Speech Synthesis (TTS) Failures**: Falls back smoothly to client browser SpeechSynthesis without halting the conversation.
- **Network Interruption**: Shows a prominent connection banner notifying the user: `⚠️ Connection interrupted. Reconnecting...`

### 6. Structured Clinical Report Card
- Once the call is ended, the LLM synthesizes the conversation history into a structured medical intake report card.
- **Premature/Short Calls**: If a user ends the call immediately after greeting, the system outputs a graceful partial report with fields marked as `Not provided` and a narrative indicating *"The call ended before sufficient health information could be collected."* (no crashes, no fake data).

---

## 🛠️ Local Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- NPM

### 1. Clone & Install Dependencies
Run from the root directory:
```bash
npm install
```
This installs dependencies across the root, client, and server workspaces.

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory:
```bash
# server/.env
PORT=5001
CLIENT_URL=http://localhost:5173

# Configuration Options (Configure at least one)
# Option A: OpenAI API Key (Highly Recommended for high-quality audio)
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Option B: Groq Cloud API Key
GROK_API_KEY=gsk_your_groq_api_key_here
GROK_MODEL=llama-3.3-70b-versatile
```

Create a `.env` file in the `client/` directory (Optional):
```bash
# client/.env
VITE_SOCKET_URL=http://localhost:5001
```

### 3. Run the Development Servers
From the root directory, run:
```bash
npm run dev
```
This runs the frontend dev server (`http://localhost:5173`) and the backend Express/Socket.io server (`http://localhost:5001`) concurrently.

---

## 🔬 How We Handle Assessment Evaluation Criteria
- **Pipeline Architecture**: Clean abstraction of STT -> LLM -> TTS services. Check out the handlers in `server/src/socket/callHandler.ts` and config routing in `server/src/utils/aiConfig.ts`.
- **State Management**: Review `server/src/session/sessionManager.ts` to see how incoming clinical parameters are merged during the call.
- **Barge-in Support**: The client audio player instantly halts playback and clears queues whenever the user clicks "Tap to Speak" or starts talking during the assistant's speech.

