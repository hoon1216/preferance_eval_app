export type EvaluationLike = {
  empathyScore: number;
  isDraft?: boolean;
};

export function submittedEvaluations<T extends EvaluationLike>(evaluations: T[]) {
  return evaluations.filter((e) => !e.isDraft);
}
