import React from "react";
import { CallStatus } from "../types";
import { CallStatusBadge } from "./CallStatus";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { Mic, PhoneCall, PhoneOff, Loader2, Sparkles, Volume2 } from "lucide-react";

interface CallInterfaceProps {
  status: CallStatus;
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  visualizerData: Uint8Array;
  onStartCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  status,
  isConnected,
  isRecording,
  isSpeaking,
  visualizerData,
  onStartCall,
  onStartRecording,
  onStopRecording,
  onEndCall,
}) => {
  const isCallActive = ["listening", "recording", "processing", "speaking"].includes(status);

  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between min-h-[380px] relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">AI Health Screening Agent</h2>
            <p className="text-xs text-slate-400">Turn-based Voice Assistant</p>
          </div>
        </div>

        <CallStatusBadge status={status} isConnected={isConnected} />
      </div>

      <div className="my-6 flex flex-col items-center justify-center space-y-4 w-full">
        <VoiceVisualizer
          isRecording={isRecording}
          isSpeaking={isSpeaking}
          visualizerData={visualizerData}
        />

        <div className="text-center h-6">
          {status === "idle" && (
            <p className="text-xs text-slate-400">Click "Start Call" to begin screening</p>
          )}
          {status === "connecting" && (
            <p className="text-xs text-amber-400 animate-pulse">Initializing voice session...</p>
          )}
          {status === "listening" && (
            <p className="text-xs text-teal-300 font-medium">Listening... Speak in English or Hindi</p>
          )}
          {status === "recording" && (
            <p className="text-xs text-rose-300 font-semibold animate-pulse">
              Listening... Auto-submits after silence (or tap to send)
            </p>
          )}
          {status === "processing" && (
            <p className="text-xs text-indigo-300 animate-pulse">Processing response...</p>
          )}
          {status === "speaking" && (
            <p className="text-xs text-cyan-300">Speaking...</p>
          )}
          {status === "ending" && (
            <p className="text-xs text-amber-300 animate-pulse">Generating summary report...</p>
          )}
          {status === "ended" && (
            <p className="text-xs text-emerald-400 font-medium">Screening finished. Review report below.</p>
          )}
        </div>

        <div className="relative">
          {!isCallActive ? (
            <button
              onClick={onStartCall}
              disabled={!isConnected || status === "connecting" || status === "ending"}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 hover:from-teal-500 hover:to-emerald-300 text-white flex flex-col items-center justify-center gap-1 shadow-xl shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {status === "connecting" ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <PhoneCall className="w-8 h-8" />
              )}
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {status === "connecting" ? "Connecting" : "Start Call"}
              </span>
            </button>
          ) : (
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={status === "processing"}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all duration-300 ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-500 text-white ring-8 ring-rose-500/20 scale-105 shadow-rose-600/40"
                  : status === "speaking"
                  ? "bg-amber-600 hover:bg-amber-500 text-white ring-8 ring-amber-500/20 shadow-amber-600/30 hover:scale-105 cursor-pointer"
                  : status === "listening"
                  ? "bg-teal-600 hover:bg-teal-500 text-white ring-8 ring-teal-500/20 shadow-teal-600/30 hover:scale-105"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80"
              }`}
            >
              {status === "processing" ? (
                <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
              ) : status === "speaking" ? (
                <Volume2 className="w-9 h-9 animate-pulse text-amber-200" />
              ) : isRecording ? (
                <Mic className="w-9 h-9 animate-bounce text-white" />
              ) : (
                <Mic className="w-9 h-9 text-teal-200" />
              )}
              <span className="text-[11px] font-bold tracking-wider uppercase text-center px-1">
                {isRecording
                  ? "Stop & Send"
                  : status === "processing"
                  ? "Thinking"
                  : status === "speaking"
                  ? "Tap to Interrupt"
                  : "Tap to Speak"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-center">
        {isCallActive && (
          <button
            onClick={onEndCall}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-semibold tracking-wide transition-all shadow-md"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span>End Call & View Report</span>
          </button>
        )}
      </div>
    </div>
  );
};
