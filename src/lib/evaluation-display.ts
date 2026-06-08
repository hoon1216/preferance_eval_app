import type { EvaluationContent } from "@/lib/evaluation-content";
import {
  formatCompletenessScore,
  mergeEvaluationComment,
} from "@/lib/evaluation-labels";

export function formatScoreDisplay(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return "—";
  return formatCompletenessScore(score);
}

export function evaluationContentFromParts(
  reason: string,
  suggestions: string
): EvaluationContent {
  return {
    reason: mergeEvaluationComment(reason, suggestions),
    suggestions: "",
  };
}

export function evaluationContentsFromParts(
  items: { reason: string; suggestions: string }[]
): EvaluationContent[] {
  return items.map((item) =>
    evaluationContentFromParts(item.reason, item.suggestions)
  );
}
