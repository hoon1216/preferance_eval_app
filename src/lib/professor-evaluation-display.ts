import type { EvaluationContent } from "@/lib/evaluation-content";
import { mergeEvaluationComment } from "@/lib/evaluation-labels";

export type ProfessorEvaluationFormValues = {
  empathyScore: number | null;
  reason: string;
  suggestions: string;
  isDraft: boolean;
};

type ObserverStored = {
  observerProfessorScore?: number | null;
  observerProfessorComment?: string | null;
  observerProfessorReason?: string | null;
  observerProfessorSuggestions?: string | null;
  observerEvaluationIsDraft?: boolean;
};

type LeadStored = {
  professorScore?: number | null;
  professorComment?: string | null;
  professorReason?: string | null;
  professorSuggestions?: string | null;
  professorEvaluationIsDraft?: boolean;
};

function resolveIsDraft(
  explicit: boolean | undefined,
  legacySubmitted: boolean
) {
  if (explicit === false) return false;
  if (explicit === true) return true;
  if (legacySubmitted) return false;
  return true;
}

export function observerEvaluationFromPresentation(
  p: ObserverStored
): ProfessorEvaluationFormValues {
  const reason =
    p.observerProfessorReason?.trim() ||
    p.observerProfessorComment?.trim() ||
    "";
  const suggestions = p.observerProfessorSuggestions?.trim() || "";
  const legacySubmitted =
    (p.observerProfessorScore != null ||
      Boolean(p.observerProfessorComment?.trim())) &&
    !Boolean(p.observerProfessorReason?.trim()) &&
    !Boolean(p.observerProfessorSuggestions?.trim());

  return {
    empathyScore: p.observerProfessorScore ?? null,
    reason,
    suggestions,
    isDraft: resolveIsDraft(p.observerEvaluationIsDraft, legacySubmitted),
  };
}

export function leadEvaluationFromPresentation(
  p: LeadStored
): ProfessorEvaluationFormValues {
  const reason =
    p.professorReason?.trim() || p.professorComment?.trim() || "";
  const suggestions = p.professorSuggestions?.trim() || "";
  const legacySubmitted =
    (p.professorScore != null || Boolean(p.professorComment?.trim())) &&
    !Boolean(p.professorReason?.trim()) &&
    !Boolean(p.professorSuggestions?.trim());

  return {
    empathyScore: p.professorScore ?? null,
    reason,
    suggestions,
    isDraft: resolveIsDraft(p.professorEvaluationIsDraft, legacySubmitted),
  };
}

export function isProfessorEvaluationSubmitted(
  evalData: ProfessorEvaluationFormValues
) {
  return !evalData.isDraft;
}

/** 제출 완료된 참관 교수 평가만 (임시저장 제외) */
export function submittedObserverEvaluation(
  p: ObserverStored
): ProfessorEvaluationFormValues | null {
  const evalData = observerEvaluationFromPresentation(p);
  return isProfessorEvaluationSubmitted(evalData) ? evalData : null;
}

/** 제출 완료된 담당 교수 평가만 (임시저장 제외) */
export function submittedLeadEvaluation(
  p: LeadStored
): ProfessorEvaluationFormValues | null {
  const evalData = leadEvaluationFromPresentation(p);
  return isProfessorEvaluationSubmitted(evalData) ? evalData : null;
}

export function submittedObserverScore(p: ObserverStored): number | null {
  return submittedObserverEvaluation(p)?.empathyScore ?? null;
}

export function submittedLeadScore(p: LeadStored): number | null {
  return submittedLeadEvaluation(p)?.empathyScore ?? null;
}

export function hasSubmittedObserverEvaluation(p: ObserverStored) {
  const evalData = submittedObserverEvaluation(p);
  return evalData != null && hasProfessorEvaluationContent(evalData);
}

export function hasSubmittedLeadEvaluation(p: LeadStored) {
  const evalData = submittedLeadEvaluation(p);
  return evalData != null && hasProfessorEvaluationContent(evalData);
}

export function hasProfessorEvaluationContent(
  evalData: ProfessorEvaluationFormValues
) {
  const comment =
    evalData.reason.trim() || evalData.suggestions.trim();
  return evalData.empathyScore != null || Boolean(comment);
}

export function professorEvaluationForModal(
  evalData: ProfessorEvaluationFormValues
): EvaluationContent[] {
  if (!isProfessorEvaluationSubmitted(evalData)) {
    return [];
  }
  if (!hasProfessorEvaluationContent(evalData)) {
    return [];
  }
  const comment = mergeEvaluationComment(
    evalData.reason,
    evalData.suggestions
  );
  return [
    {
      reason: comment || "—",
      suggestions: "",
    },
  ];
}
