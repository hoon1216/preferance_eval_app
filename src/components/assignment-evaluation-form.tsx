"use client";

import {
  COMPLETENESS_LABEL,
  COMMENT_LABEL,
  formatCompletenessScore,
  SCORE_MAX,
  SCORE_MIN,
  SCORE_STEP,
} from "@/lib/evaluation-labels";

type Props = {
  completenessScore: number;
  comment: string;
  onCompletenessScoreChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  error?: string;
  draftSaved?: boolean;
  loading?: boolean;
  draftSaving?: boolean;
  onDraft: () => void;
  readOnly?: boolean;
};

export function AssignmentEvaluationForm({
  completenessScore,
  comment,
  onCompletenessScoreChange,
  onCommentChange,
  error,
  draftSaved,
  loading,
  draftSaving,
  onDraft,
  readOnly = false,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">
          1. {COMPLETENESS_LABEL} (10점 만점):{" "}
          {formatCompletenessScore(completenessScore)}점
        </label>
        <input
          type="range"
          min={SCORE_MIN}
          max={SCORE_MAX}
          step={SCORE_STEP}
          value={completenessScore}
          disabled={readOnly}
          onChange={(e) =>
            onCompletenessScoreChange(Number(e.target.value))
          }
          className="mt-2 w-full disabled:opacity-60"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{SCORE_MIN}</span>
          <span>{SCORE_MAX}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">2. {COMMENT_LABEL}</label>
        <textarea
          rows={6}
          value={comment}
          disabled={readOnly}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="과제에 대한 평가 의견을 작성해주세요"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:opacity-60"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {draftSaved && (
        <p className="text-sm text-emerald-700">임시저장되었습니다.</p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={draftSaving || loading}
            onClick={onDraft}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            {draftSaving ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="submit"
            disabled={loading || draftSaving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "제출 중..." : "평가 제출"}
          </button>
        </div>
      )}
    </div>
  );
}
