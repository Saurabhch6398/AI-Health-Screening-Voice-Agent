# AI Health Screening Voice Agent

Full-stack voice screening agent built with React, Node.js, Express, and Socket.io. Uses OpenAI Whisper for STT and Groq/Grok LLM for turn-based clinical voice intake and report generation.

**Live Demo**: [https://ai-health-screening-voice-agent-cli.vercel.app](https://ai-health-screening-voice-agent-cli.vercel.app)

## Features

- Real-time turn-based voice intake over WebSockets (Socket.io)
- English voice assistant intake
- Live audio waveform visualizer (Web Audio API)
- Barge-in / speech interruption support
- Structured health state tracking across conversation turns
- Automatic clinical summary report generation at call completion

## Project Structure

```text
client/    React + Vite frontend (Tailwind CSS, Lucide Icons, Socket.io client)
server/    Node.js + Express backend (Socket.io server, Whisper STT, LLM services)
```

## Setup & Running

### 1. Install dependencies

```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 2. Configure Environment

Create `server/.env`:
```env
PORT=5001
CLIENT_URL=http://localhost:5173

# API Keys (Groq or Grok)
GROK_API_KEY=gsk_your_api_key_here
GROK_MODEL=llama-3.3-70b-versatile
```

Optional `client/.env`:
```env
VITE_SOCKET_URL=http://localhost:5001
```

### 3. Start Development Servers

```bash
# Start backend
cd server
npm run dev

# Start frontend
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.
