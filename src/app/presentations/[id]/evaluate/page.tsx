"use client";

import { AssignmentEvaluationForm } from "@/components/assignment-evaluation-form";
import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  mergeEvaluationComment,
  normalizeCompletenessScore,
} from "@/lib/evaluation-labels";
import { parseJsonResponse } from "@/lib/parse-json-response";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MyEvaluation = {
  empathyScore: number;
  reason: string;
  suggestions: string;
  isDraft: boolean;
};

type Presentation = {
  id: string;
  courseId: string;
  title: string | null;
  overview: string | null;
  status: string;
  hasSubmittedEvaluation: boolean;
  isAssignmentReady: boolean;
  isPresenter: boolean;
  myEvaluation: MyEvaluation | null;
  presenter: { name: string; studentId: string | null };
};

export default function EvaluatePage() {
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

  function applyEvaluation(evalData: MyEvaluation | null) {
    if (!evalData) return;
    setCompletenessScore(
      normalizeCompletenessScore(evalData.empathyScore, 5) ?? 5
    );
    setComment(mergeEvaluationComment(evalData.reason, evalData.suggestions));
  }

  useEffect(() => {
    (async () => {
      setLoadError("");
      const res = await fetch(`/api/presentations/${id}`);
      const data = await parseJsonResponse<Presentation & { error?: string }>(res);
      if (!res.ok || !data) {
        setLoadError(data?.error ?? "발표 정보를 불러오지 못했습니다.");
        return;
      }
      setPresentation(data);
      applyEvaluation(data.myEvaluation ?? null);
    })();
  }, [id]);

  async function saveDraft() {
    setDraftSaving(true);
    setError("");
    setDraftSaved(false);

    const res = await fetch(`/api/presentations/${id}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: true,
        empathyScore: completenessScore,
        reason: comment,
        suggestions: "",
      }),
    });

    const data = await parseJsonResponse<{ error?: string }>(res);
    setDraftSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "임시저장에 실패했습니다.");
      return;
    }

    setDraftSaved(true);
    if (data && "empathyScore" in data) {
      applyEvaluation(data as MyEvaluation);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/presentations/${id}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: false,
        empathyScore: completenessScore,
        reason: comment,
        suggestions: "",
      }),
    });

    const data = await parseJsonResponse<{ error?: string }>(res);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "평가 제출에 실패했습니다.");
      return;
    }

    router.push(`/dashboard/courses/${presentation?.courseId ?? ""}`);
    router.refresh();
  }

  if (!presentation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        {loadError ? (
          <p className="text-red-600">{loadError}</p>
        ) : (
          "불러오는 중..."
        )}
      </div>
    );
  }

  const courseHref = `/dashboard/courses/${presentation.courseId}`;

  if (presentation.isPresenter) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-600">본인 과제는 평가할 수 없습니다.</p>
        <Link href={courseHref} className="mt-4 inline-block text-blue-600">
          평가 내용 화면으로
        </Link>
      </div>
    );
  }

  if (!presentation.isAssignmentReady) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-zinc-600">
          아직 과제가 등록되지 않아 평가할 수 없습니다.
        </p>
        <Link href={courseHref} className="mt-4 inline-block text-blue-600">
          평가 내용 화면으로
        </Link>
      </div>
    );
  }

  if (presentation.hasSubmittedEvaluation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-green-700">이미 평가를 제출했습니다.</p>
        <Link href={courseHref} className="mt-4 inline-block text-blue-600">
          평가 내용 화면으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">과제 평가</h1>
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
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-zinc-200 bg-white p-6"
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
          onDraft={saveDraft}
        />
      </form>
    </div>
  );
}
