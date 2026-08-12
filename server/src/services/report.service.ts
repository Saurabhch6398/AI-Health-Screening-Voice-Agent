import OpenAI from "openai";
import { CallSession, HealthReport } from "../types/health.js";
import { HEALTH_REPORT_SYSTEM_PROMPT, buildReportUserPrompt } from "../prompts/healthReport.prompt.js";
import { createAiClient, getAiConfig } from "../utils/aiConfig.js";
import { logger } from "../utils/logger.js";

const DEFAULT_DISCLAIMER =
  "This AI-generated screening summary is based only on the information shared during the conversation. It is not a medical diagnosis and should not replace professional medical advice.";

export class ReportService {
  private openai: OpenAI | null = null;
  private model: string;

  constructor() {
    const config = getAiConfig();
    this.model = config.model;
    this.openai = createAiClient();

    if (!this.openai) {
      logger.warn("ReportService: API key is missing or not configured.");
    }
  }

  public async generateReport(session: CallSession): Promise<HealthReport> {
    const { healthData, messages } = session;

    if (this.openai) {
      try {
        logger.info(`Generating Health Report with ${this.model} for session ${session.id}...`);

        const completion = await this.openai.chat.completions.create({
          model: this.model,
          response_format: { type: "json_object" },
          temperature: 0.1,
          messages: [
            { role: "system", content: HEALTH_REPORT_SYSTEM_PROMPT },
            { role: "user", content: buildReportUserPrompt(session) },
          ],
        });

        let rawContent = completion.choices[0]?.message?.content || "";
        rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

        const parsed = JSON.parse(rawContent);

        const report: HealthReport = {
          screeningStatus: parsed.screeningStatus || (healthData.screeningComplete ? "complete" : "partial"),
          patientName: parsed.patientName || healthData.name || null,
          mainConcern: parsed.mainConcern || healthData.mainConcern || null,
          duration: parsed.duration || healthData.duration || null,
          severity: parsed.severity || healthData.severity || null,
          keySymptoms: Array.isArray(parsed.keySymptoms) && parsed.keySymptoms.length > 0 ? parsed.keySymptoms : (healthData.relatedSymptoms.length > 0 ? healthData.relatedSymptoms : ["Not discussed"]),
          medications: Array.isArray(parsed.medications) && parsed.medications.length > 0 ? parsed.medications : (healthData.medications.length > 0 ? healthData.medications : ["None reported"]),
          allergies: Array.isArray(parsed.allergies) && parsed.allergies.length > 0 ? parsed.allergies : (healthData.allergies.length > 0 ? healthData.allergies : ["None reported"]),
          relevantHistory: Array.isArray(parsed.relevantHistory) && parsed.relevantHistory.length > 0 ? parsed.relevantHistory : (healthData.relevantMedicalHistory.length > 0 ? healthData.relevantMedicalHistory : ["None reported"]),
          followUpFlags: Array.isArray(parsed.followUpFlags) ? parsed.followUpFlags : (healthData.redFlags.length > 0 ? healthData.redFlags : []),
          summary: parsed.summary || "Health screening summary completed.",
          informationMissing: Array.isArray(parsed.informationMissing) ? parsed.informationMissing : [],
          disclaimer: parsed.disclaimer || DEFAULT_DISCLAIMER,
        };

        logger.info(`Report generated successfully for session ${session.id}. Status: ${report.screeningStatus}`);
        return report;
      } catch (error: any) {
        logger.error("ReportService AI Error:", error?.message || error);
      }
    }

    // Fallback Report generation when AI call fails or key is missing
    logger.info(`Using fallback report generator for session ${session.id}...`);
    return this.buildFallbackReport(session);
  }

  private buildFallbackReport(session: CallSession): HealthReport {
    const { healthData, messages } = session;
    const userMessages = messages.filter((m) => m.role === "user");

    const missing: string[] = [];
    if (!healthData.name) missing.push("Patient Name");
    if (!healthData.mainConcern) missing.push("Main Health Concern");
    if (!healthData.duration) missing.push("Duration of symptoms");
    if (!healthData.severity) missing.push("Severity level");
    if (healthData.relatedSymptoms.length === 0) missing.push("Related symptoms");

    let status: "complete" | "partial" | "limited" = "complete";
    if (userMessages.length === 0 || !healthData.mainConcern) {
      status = "limited";
    } else if (missing.length > 0) {
      status = "partial";
    }

    const summaryText =
      status === "limited"
        ? "The call ended before sufficient health information could be collected."
        : `Patient ${healthData.name || "User"} reported ${healthData.mainConcern || "a health concern"} occurring for ${healthData.duration || "an unspecified period"}. ${healthData.severity ? `Severity was noted as ${healthData.severity}.` : ""}`;

    return {
      screeningStatus: status,
      patientName: healthData.name || null,
      mainConcern: healthData.mainConcern || null,
      duration: healthData.duration || null,
      severity: healthData.severity || null,
      keySymptoms: healthData.relatedSymptoms.length > 0 ? healthData.relatedSymptoms : ["Not discussed"],
      medications: healthData.medications.length > 0 ? healthData.medications : ["None reported"],
      allergies: healthData.allergies.length > 0 ? healthData.allergies : ["None reported"],
      relevantHistory: healthData.relevantMedicalHistory.length > 0 ? healthData.relevantMedicalHistory : ["None reported"],
      followUpFlags: healthData.redFlags.length > 0 ? healthData.redFlags : [],
      summary: summaryText,
      informationMissing: missing,
      disclaimer: DEFAULT_DISCLAIMER,
    };
  }
}
