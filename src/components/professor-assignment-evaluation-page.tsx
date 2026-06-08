"use client";

import { AssignmentEvaluationForm } from "@/components/assignment-evaluation-form";
import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  mergeEvaluationComment,
  normalizeCompletenessScore,
} from "@/lib/evaluation-labels";
import { parseJsonResponse } from "@/lib/parse-json-response";
import {
  isProfessorEvaluationSubmitted,
  type ProfessorEvaluationFormValues,
} from "@/lib/professor-evaluation-display";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Presentation = {
  id: string;
  courseId: string;
  title: string | null;
  overview: string | null;
  isAssignmentReady: boolean;
  presenter: { name: string; studentId: string | null };
  professorEvaluation: ProfessorEvaluationFormValues;
};

type Props = {
  pageTitle: string;
  evaluationRole: "observer" | "lead";
};

export function ProfessorAssignmentEvaluationPage({
  pageTitle,
  evaluationRole,
}: Props) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [completenessScore, setCompletenessScore] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [loadError, setLoadError] = useState("");

  function applyEvaluation(evalData: ProfessorEvaluationFormValues) {
    setCompletenessScore(
      normalizeCompletenessScore(evalData.empathyScore, 5) ?? 5
    );
    setComment(mergeEvaluationComment(evalData.reason, evalData.suggestions));
  }

  useEffect(() => {
    (async () => {
      setLoadError("");
      const res = await fetch(`/api/presentations/${id}`);
      const data = await parseJsonResponse<
        Presentation & { error?: string }
      >(res);
      if (!res.ok || !data) {
        setLoadError(data?.error ?? "발표 정보를 불러오지 못했습니다.");
        return;
      }
      setPresentation(data);
      applyEvaluation(data.professorEvaluation);
    })();
  }, [id]);

  async function saveEvaluation(draft: boolean) {
    if (!presentation) return;

    if (draft) {
      setDraftSaving(true);
    } else {
      setLoading(true);
    }
    setError("");
    setDraftSaved(false);

    const res = await fetch(`/api/presentations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluationRole,
        draft,
        empathyScore: completenessScore,
        reason: comment,
        suggestions: "",
      }),
    });

    const data = await parseJsonResponse<{
      error?: string;
      professorEvaluation?: ProfessorEvaluationFormValues;
    }>(res);

    if (draft) {
      setDraftSaving(false);
    } else {
      setLoading(false);
    }

    if (!res.ok) {
      setError(data?.error ?? "저장에 실패했습니다.");
      return;
    }

    if (data?.professorEvaluation) {
      applyEvaluation(data.professorEvaluation);
      setPresentation((prev) =>
        prev ? { ...prev, professorEvaluation: data.professorEvaluation! } : prev
      );
    }

    if (draft) {
      setDraftSaved(true);
      return;
    }

    router.push(`/dashboard/courses/${presentation.courseId}`);
    router.refresh();
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-600">{loadError}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          평가 목록으로
        </Link>
      </div>
    );
  }

  if (!presentation) {
    return <div className="mx-auto max-w-2xl px-4 py-10">불러오는 중...</div>;
  }

  const courseHref = `/dashboard/courses/${presentation.courseId}`;

  if (!presentation.isAssignmentReady) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-zinc-600">아직 과제가 등록되지 않아 평가할 수 없습니다.</p>
        <Link href={courseHref} className="mt-4 inline-block text-blue-600 hover:underline">
          평가 결과로 돌아가기
        </Link>
      </div>
    );
  }

  if (isProfessorEvaluationSubmitted(presentation.professorEvaluation)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-green-700">이미 평가를 제출했습니다.</p>
        <Link href={courseHref} className="mt-4 inline-block text-blue-600 hover:underline">
          평가 결과로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{pageTitle}</h1>
      <p className="mt-1 text-zinc-600">
        발표자: {presentation.presenter.name} (
        {presentation.presenter.studentId ?? "학번 미등록"})
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {COMPLETENESS_LABEL}(0.5점 단위)와 {COMMENT_LABEL}을 입력해주세요.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{presentation.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {presentation.overview}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveEvaluation(false);
        }}
        className="mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <AssignmentEvaluationForm
          completenessScore={completenessScore}
          comment={comment}
          onCompletenessScoreChange={setCompletenessScore}
          onCommentChange={setComment}
          error={error}
          draftSaved={draftSaved}
          loading={loading}
          draftSaving={draftSaving}
          onDraft={() => saveEvaluation(true)}
        />
      </form>
    </div>
  );
}
