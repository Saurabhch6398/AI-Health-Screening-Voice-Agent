import React, { useRef, useEffect } from "react";
import { ConversationMessage, HealthScreeningState } from "../types";
import { formatTimestamp } from "../lib/utils";
import { Bot, User, HeartPulse, ShieldAlert, Pill, CheckCircle } from "lucide-react";

interface ConversationTranscriptProps {
  messages: ConversationMessage[];
  healthState?: HealthScreeningState;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  healthState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
      {/* Header with Extracted State Summary Pills */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-400" />
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Live Conversation & State</h3>
          </div>
          <span className="text-xs text-slate-400">{messages.length} messages</span>
        </div>

        {/* Real-time Extracted Data Pills */}
        {healthState && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-800/50 text-xs">
            {healthState.name && (
              <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1">
                <User className="w-3 h-3 text-teal-400" />
                <span>{healthState.name}</span>
              </span>
            )}
            {healthState.mainConcern && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-indigo-400" />
                <span>{healthState.mainConcern}</span>
              </span>
            )}
            {healthState.duration && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Duration: {healthState.duration}
              </span>
            )}
            {healthState.severity && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Severity: {healthState.severity}
              </span>
            )}
            {healthState.relatedSymptoms.map((sym, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                + {sym}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Message List */}
      <div
        ref={containerRef}
        className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
            <Bot className="w-10 h-10 stroke-1 text-slate-600 mb-2" />
            <p className="text-sm">Click "Start Call" to begin the health screening conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-teal-600 text-white"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                    <span className="font-medium text-slate-300">
                      {isUser ? "You" : "AI Screening Assistant"}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600/80 text-indigo-50 border border-indigo-500/30 rounded-tr-none shadow-sm"
                        : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
