import type { EvaluationContent } from "@/lib/evaluation-content";
import {
  COMMENT_LABEL,
  mergeEvaluationComment,
} from "@/lib/evaluation-labels";

export { COMMENT_LABEL };

export function collectComments(items: EvaluationContent[]): string[] {
  return items
    .map((item) => mergeEvaluationComment(item.reason, item.suggestions))
    .filter(Boolean);
}

export function hasGroupedEvaluationContent(items: EvaluationContent[]) {
  return collectComments(items).length > 0;
}

export function mergeProfessorEvaluationItems(
  observer: EvaluationContent | null,
  professor: EvaluationContent | null
): EvaluationContent[] {
  const items: EvaluationContent[] = [];
  if (observer) items.push(observer);
  if (professor) items.push(professor);
  return items;
}
