import React, { useCallback, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { CallInterface } from "./components/CallInterface";
import { ConversationTranscript } from "./components/ConversationTranscript";
import { HealthReportCard } from "./components/HealthReport";
import { ErrorMessage } from "./components/ErrorMessage";
import { ShieldAlert, Stethoscope } from "lucide-react";

export function App() {
  const {
    isConnected,
    status,
    setStatus,
    messages,
    healthState,
    callState,
    report,
    error,
    latestAudio,
    startCall,
    sendUserAudio,
    endCall,
    resetCall,
    clearError,
  } = useSocket();

  const [language, setLanguage] = React.useState<"en" | "hi" | "auto">("en");

  const {
    isRecording,
    permissionDenied,
    visualizerData,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const handlePlaybackFinished = useCallback(() => {
    if (status === "speaking") {
      setStatus("listening");
    }
  }, [status, setStatus]);

  const latestAssistantMessage = messages.filter((m) => m.role === "assistant").slice(-1)[0]?.content;

  const { isPlaying, stopPlayback } = useAudioPlayer(
    latestAudio,
    latestAssistantMessage,
    handlePlaybackFinished
  );

  const handleStopRecording = useCallback(async () => {
    const recordResult = await stopRecording();
    if (recordResult && recordResult.blob) {
      sendUserAudio(recordResult.blob, recordResult.mimeType);
    } else {
      setStatus("listening");
    }
  }, [stopRecording, sendUserAudio, setStatus]);

  const handleStartRecording = useCallback(async () => {
    stopPlayback();
    const success = await startRecording(handleStopRecording);
    if (success) {
      setStatus("recording");
    }
  }, [stopPlayback, startRecording, handleStopRecording, setStatus]);

  useEffect(() => {
    if (status === "listening" && !isRecording) {
      const autoTimer = setTimeout(() => {
        handleStartRecording();
      }, 400);
      return () => clearTimeout(autoTimer);
    }
  }, [status, isRecording, handleStartRecording]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      <header className="w-full border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>AI Health Screening</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Voice Agent
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-ping"}`} />
            <span>{isConnected ? "Server Connected" : "Connection Interrupted"}</span>
          </div>
        </div>
      </header>

      {!isConnected && (
        <div className="w-full bg-rose-950/80 border-b border-rose-800/60 text-rose-300 text-xs py-2 text-center font-semibold animate-pulse z-40">
          ⚠️ Connection interrupted. Reconnecting to backend server...
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-6">
        <div className="w-full bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-indigo-300">
                AI Preliminary Health Screening
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Have a short voice conversation with an AI assistant to help organize your symptoms and generate a structured health summary.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-amber-300">Disclaimer:</strong> This assistant provides preliminary health screening only and does not offer formal medical diagnosis or emergency care.
            </p>
          </div>
        </div>

        <ErrorMessage
          error={
            permissionDenied
              ? {
                  code: "MIC_PERMISSION",
                  message: "Microphone access is required to use voice conversation. Please allow microphone access in browser settings.",
                  recoverable: true,
                }
              : error
          }
          onDismiss={clearError}
          onRetry={status === "error" ? () => startCall(language) : undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 w-full">
            <CallInterface
              status={status}
              isConnected={isConnected}
              isRecording={isRecording}
              isSpeaking={isPlaying}
              visualizerData={visualizerData}
              language={language}
              setLanguage={setLanguage}
              onStartCall={() => startCall(language)}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onEndCall={endCall}
            />
          </div>

          <div className="lg:col-span-7 w-full h-[480px]">
            <ConversationTranscript messages={messages} healthState={healthState} callState={callState} />
          </div>
        </div>

        {report && (
          <div className="w-full pt-4">
            <HealthReportCard report={report} onStartNewCall={resetCall} />
          </div>
        )}
      </main>

      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI Health Screening Voice Agent</p>
          <p className="text-slate-400">Powered by Whisper STT & LLM</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
