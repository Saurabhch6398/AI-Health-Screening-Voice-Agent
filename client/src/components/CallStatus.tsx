import React from "react";
import { CallStatus } from "../types";
import { Activity, Mic, Volume2, Loader2, CheckCircle2, AlertCircle, WifiOff } from "lucide-react";

interface CallStatusProps {
  status: CallStatus;
  isConnected: boolean;
}

export const CallStatusBadge: React.FC<CallStatusProps> = ({ status, isConnected }) => {
  if (!isConnected) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <WifiOff className="w-3.5 h-3.5 animate-pulse" />
        <span>Disconnected</span>
      </div>
    );
  }

  switch (status) {
    case "idle":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Ready to Start</span>
        </div>
      );
    case "connecting":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting...</span>
        </div>
      );
    case "listening":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm shadow-teal-500/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span>Microphone Ready</span>
        </div>
      );
    case "recording":
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
          <Mic className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          <span>Listening to you...</span>
        </div>
      );
    case "processing":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Processing speech...</span>
        </div>
      );
    case "speaking":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <Volume2 className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>AI Assistant Speaking</span>
        </div>
      );
    case "ending":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Generating Health Report...</span>
        </div>
      );
    case "ended":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Screening Completed</span>
        </div>
      );
    case "error":
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Call Error</span>
        </div>
      );
    default:
      return null;
  }
};
