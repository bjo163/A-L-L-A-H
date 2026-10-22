import type { ChangeRequestModel } from "../models/change-request.model.js";
import { checkAdabText } from "../scanner.js";

export interface SeraphEvaluation {
  code: "mooncore" | "narkick" | "malikfire" | "ezkill";
  role: "arbiter" | "sentinel" | "bastion" | "reaper";
  verdict: "affirm" | "inquire" | "dissent";
  notes: string;
  confidence: number;
}

/** Repeatable policy checks; these records are system checks, not model generated judgments. */
export function evaluateBySeraphCouncil(rfc: ChangeRequestModel): SeraphEvaluation[] {
  const content = [
    rfc.title,
    rfc.summary,
    rfc.justification,
    rfc.executionPlan,
    rfc.rollbackPlan,
  ].join("\n");
  const adab = checkAdabText(content);
  const credentialExposure =
    /(?:password|secret|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S+/i.test(content);
  const hasRollbackSteps =
    rfc.rollbackPlan.trim().length >= 30 &&
    /rollback|restore|revert|pulihkan|kembalikan|pemulihan/i.test(rfc.rollbackPlan);
  const highRisk =
    ["high", "critical"].includes(rfc.riskLevel) || ["critical", "emergency"].includes(rfc.tier);
  const hasWindow = Boolean(rfc.scheduledWindowStart && rfc.scheduledWindowEnd);
  return [
    {
      code: "mooncore",
      role: "arbiter",
      verdict:
        rfc.justification.trim().length >= 40 && rfc.summary.trim().length >= 30
          ? "affirm"
          : "inquire",
      notes:
        rfc.justification.trim().length >= 40 && rfc.summary.trim().length >= 30
          ? "Ringkasan dan alasan memenuhi batas minimum keterbacaan."
          : "Tambahkan alasan dan ringkasan yang lebih lengkap.",
      confidence: rfc.justification.trim().length >= 40 ? 90 : 55,
    },
    {
      code: "narkick",
      role: "sentinel",
      verdict: !highRisk || (hasRollbackSteps && hasWindow) ? "affirm" : "inquire",
      notes:
        !highRisk || (hasRollbackSteps && hasWindow)
          ? "Kontrol risiko tersedia untuk tingkat dampak ini."
          : "Risiko tinggi memerlukan rencana rollback terperinci dan jendela jadwal.",
      confidence: highRisk ? 85 : 75,
    },
    {
      code: "malikfire",
      role: "bastion",
      verdict: credentialExposure || !adab.passed ? "dissent" : "affirm",
      notes: credentialExposure
        ? "Usulan tampak memuat nilai yang menyerupai kredensial; hapus sebelum diajukan."
        : !adab.passed
          ? "Konten tidak lolos pemeriksaan adab."
          : "Tidak ditemukan pola kredensial atau pelanggaran aturan adab.",
      confidence: credentialExposure || !adab.passed ? 98 : 80,
    },
    {
      code: "ezkill",
      role: "reaper",
      verdict: hasRollbackSteps ? "affirm" : "inquire",
      notes: hasRollbackSteps
        ? "Rencana pemulihan menyebut langkah rollback yang dapat ditinjau."
        : "Perjelas langkah pemulihan dan cara mengembalikan layanan.",
      confidence: hasRollbackSteps ? 88 : 50,
    },
  ];
}
