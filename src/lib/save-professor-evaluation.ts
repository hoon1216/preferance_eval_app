import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  normalizeCompletenessScore,
} from "@/lib/evaluation-labels";
import {
  getProfessorFields,
  updatePresentationProfessorFields,
  type ProfessorFieldValues,
} from "@/lib/presentation-professor-fields";
import {
  isProfessorEvaluationSubmitted,
  leadEvaluationFromPresentation,
  observerEvaluationFromPresentation,
  type ProfessorEvaluationFormValues,
} from "@/lib/professor-evaluation-display";

export type ProfessorEvalRole = "observer" | "lead";

export async function saveProfessorEvaluation(
  presentationId: string,
  role: ProfessorEvalRole,
  body: Record<string, unknown>
): Promise<{ error?: string; professorEvaluation?: ProfessorEvaluationFormValues }> {
  const isDraft = body.draft === true;
  const completenessScore = normalizeCompletenessScore(body.empathyScore);
  const comment = String(body.reason ?? "").trim();

  const current = await getProfessorFields(presentationId);
  const currentEval =
    role === "observer"
      ? observerEvaluationFromPresentation(current)
      : leadEvaluationFromPresentation(current);

  if (isProfessorEvaluationSubmitted(currentEval)) {
    return { error: "이미 평가를 제출했습니다. 제출 후에는 수정할 수 없습니다." };
  }

  if (!isDraft) {
    if (completenessScore === null) {
      return { error: `${COMPLETENESS_LABEL} 점수를 선택해주세요.` };
    }
    if (!comment) {
      return { error: `${COMMENT_LABEL}을 입력해주세요.` };
    }
  }

  const score = completenessScore ?? currentEval.empathyScore ?? 5;

  const update: Partial<ProfessorFieldValues> =
    role === "observer"
      ? {
          observerProfessorScore: score,
          observerProfessorReason: comment,
          observerProfessorSuggestions: "",
          observerProfessorComment: null,
          observerEvaluationIsDraft: isDraft,
        }
      : {
          professorScore: score,
          professorReason: comment,
          professorSuggestions: "",
          professorComment: null,
          professorEvaluationIsDraft: isDraft,
        };

  await updatePresentationProfessorFields(presentationId, update);

  const saved = await getProfessorFields(presentationId);
  const professorEvaluation =
    role === "observer"
      ? observerEvaluationFromPresentation(saved)
      : leadEvaluationFromPresentation(saved);

  return { professorEvaluation };
}
