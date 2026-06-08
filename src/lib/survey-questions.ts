/** 조사 질문 문항 — presenterId가 없는 Presentation */

export const surveyQuestionFilter = {
  presenterId: null,
} as const;

export function isSurveyQuestionRegistered(p: {
  title: string | null;
  overview: string | null;
  status?: string;
}) {
  return (
    Boolean(p.title?.trim()) &&
    Boolean(p.overview?.trim()) &&
    p.status === "READY"
  );
}
