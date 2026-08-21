import React from "react";
import { HealthReport as HealthReportType } from "../types";
import {
  FileText,
  User,
  Activity,
  AlertTriangle,
  Clock,
  Pill,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Info,
  Stethoscope,
} from "lucide-react";

interface HealthReportProps {
  report: HealthReportType | null;
  onStartNewCall: () => void;
}

export const HealthReportCard: React.FC<HealthReportProps> = ({ report, onStartNewCall }) => {
  if (!report) return null;

  const getStatusBadge = (status: "complete" | "partial" | "limited") => {
    switch (status) {
      case "complete":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Complete Screening</span>
          </span>
        );
      case "partial":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Partial Screening</span>
          </span>
        );
      case "limited":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Limited Information</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-lg transition-all">
      {/* Header Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-md">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Structured Health Screening Summary
            </h2>
            <p className="text-xs text-slate-400">Synthesized from AI voice conversation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(report.screeningStatus)}
          <button
            onClick={onStartNewCall}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-lg shadow-teal-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Start New Call</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Demographics & Primary Concern Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>Patient Name</span>
            </div>
            <p className="text-base font-bold text-slate-100">
              {report.patientName || "Not provided"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Primary Concern</span>
            </div>
            <p className="text-base font-bold text-slate-100">
              {report.mainConcern || "Not provided"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Duration</span>
            </div>
            <p className="text-base font-bold text-slate-100">
              {report.duration || "Not provided"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-teal-400" />
              <span>Severity Level</span>
            </div>
            <p className="text-base font-bold text-slate-100">
              {report.severity || "Not provided"}
            </p>
          </div>
        </div>

        {/* Symptoms & Medical History Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Symptoms */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-700/50 pb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Key & Related Symptoms</span>
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-300 pt-1">
              {report.keySymptoms.map((sym, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{sym}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Medications & Allergies */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-700/50 pb-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <span>Medications & Allergies</span>
            </h4>
            <div className="text-sm text-slate-300 space-y-2 pt-1">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Medications:</span>
                <p>{report.medications.join(", ")}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Allergies:</span>
                <p>{report.allergies.join(", ")}</p>
              </div>
            </div>
          </div>

          {/* Relevant History */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-700/50 pb-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Relevant Medical History</span>
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-300 pt-1">
              {report.relevantHistory.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Red Flags & Missing Information Callouts */}
        {(report.followUpFlags.length > 0 || report.informationMissing.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.followUpFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Red Flags & Safety Urgent Notes</span>
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {report.followUpFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.informationMissing.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-amber-300">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Missing Information</span>
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {report.informationMissing.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Clinical Narrative Summary */}
        <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <span>Clinical Screening Narrative</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed italic">{report.summary}</p>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-slate-400 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
          <p>{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
