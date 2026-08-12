import React from "react";
import { ErrorMessageData } from "../types";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: ErrorMessageData | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <div className="w-full max-w-2xl mx-auto my-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 shadow-lg backdrop-blur-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-rose-300">
              {error.code ? `Notice (${error.code})` : "Attention Required"}
            </h4>
            <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{error.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {error.recoverable && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Dismiss error message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
