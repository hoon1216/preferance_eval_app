export const COMPLETENESS_LABEL = "완성도";
export const COMMENT_LABEL = "평가 의견";

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.5;

export function formatCompletenessScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function normalizeCompletenessScore(
  value: unknown,
  fallback: number | null = null
): number | null {
  const n = Number(value);
  if (Number.isNaN(n) || n < SCORE_MIN || n > SCORE_MAX) {
    return fallback;
  }
  const stepped = Math.round(n / SCORE_STEP) * SCORE_STEP;
  return Math.round(stepped * 10) / 10;
}

export function isValidCompletenessScore(value: number) {
  return normalizeCompletenessScore(value) === value;
}

export function mergeEvaluationComment(reason: string, suggestions: string) {
  const parts = [reason.trim(), suggestions.trim()].filter(Boolean);
  return parts.join("\n\n");
}
