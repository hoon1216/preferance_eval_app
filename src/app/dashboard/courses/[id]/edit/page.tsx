"use client";

import { LinkActions } from "@/components/link-actions";
import {
  ADD_QUESTION_LABEL,
  CUSTOMER_EVAL_LABEL,
  MANAGER_EVAL_LABEL,
  QUESTION_CONTENT_LABEL,
  QUESTION_LIST_LABEL,
  QUESTION_TITLE_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_EDIT_LABEL,
  SURVEY_INFO_LABEL,
  SURVEY_LABEL,
  SURVEY_NAME_LABEL,
  SURVEY_WEIGHT_LABEL,
} from "@/lib/ui-labels";
import { displayOrUnregistered } from "@/lib/default-password";
import { canManageCourse } from "@/lib/permissions";
import { parseJsonResponse } from "@/lib/parse-json-response";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type QuestionRow = {
  id: string;
  title: string;
  overview: string;
  orderIndex: number;
};

type ObserverRow = {
  id: string;
  name: string;
  department: string | null;
  email: string | null;
};

function QuestionTable({
  rows,
  editingId,
  editTitle,
  editOverview,
  onEditStart,
  onEditCancel,
  onEditTitleChange,
  onEditOverviewChange,
  onEditSave,
  onDelete,
}: {
  rows: QuestionRow[];
  editingId: string | null;
  editTitle: string;
  editOverview: string;
  onEditStart: (row: QuestionRow) => void;
  onEditCancel: () => void;
  onEditTitleChange: (v: string) => void;
  onEditOverviewChange: (v: string) => void;
  onEditSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold">
        {QUESTION_LIST_LABEL}
      </h2>
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="w-12 px-4 py-3">순번</th>
            <th className="px-4 py-3">{QUESTION_TITLE_LABEL}</th>
            <th className="px-4 py-3">{QUESTION_CONTENT_LABEL}</th>
            <th className="px-4 py-3">첨부</th>
            <th className="w-32 px-4 py-3">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                등록된 질문 문항이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editTitle}
                        onChange={(e) => onEditTitleChange(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="font-medium">{row.title}</span>
                    )}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    {isEditing ? (
                      <textarea
                        value={editOverview}
                        onChange={(e) => onEditOverviewChange(e.target.value)}
                        rows={2}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="line-clamp-2">{row.overview}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/presentations/${row.id}/prep`}
                      className="text-blue-600 hover:underline"
                    >
                      PDF
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEditSave(row.id)}
                          className="rounded border border-blue-200 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={onEditCancel}
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs hover:bg-zinc-50"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEditStart(row)}
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs hover:bg-zinc-50"
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function CustomerTable({
  rows,
  onDelete,
}: {
  rows: ObserverRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold">고객 목록</h2>
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="w-12 px-4 py-3">순번</th>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">이메일</th>
            <th className="w-20 px-4 py-3">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                등록된 고객이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className="border-b border-zinc-100">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">
                  {displayOrUnregistered(row.email)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function EvaluationEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const courseId = params.id as string;
  const [courseName, setCourseName] = useState("");
  const [courseJoinUrl, setCourseJoinUrl] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [observers, setObservers] = useState<ObserverRow[]>([]);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionOverview, setQuestionOverview] = useState("");
  const [observerName, setObserverName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOverview, setEditOverview] = useState("");
  const [editName, setEditName] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [weightPeer, setWeightPeer] = useState(50);
  const [weightObserver, setWeightObserver] = useState(25);
  const [weightLead, setWeightLead] = useState(25);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [courseRes, questionsRes, observersRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/questions`),
      fetch(`/api/courses/${courseId}/observers`),
    ]);

    if (courseRes.ok) {
      const json = await courseRes.json();
      setCourseName(json.course.name ?? "");
      setEditName(json.course.name ?? "");
      setEditDateTime(json.course.semester ?? "");
      setWeightPeer(Math.round(json.course.weightPeer ?? 50));
      setWeightObserver(Math.round(json.course.weightObserver ?? 25));
      setWeightLead(Math.round(json.course.weightLead ?? 25));
      setCourseJoinUrl(json.course.joinUrl ?? "");
    } else {
      const json = await parseJsonResponse<{ error?: string }>(courseRes);
      setError(json?.error ?? `${SURVEY_INFO_LABEL}를 불러오지 못했습니다.`);
    }
    if (questionsRes.ok) {
      const list = await questionsRes.json();
      setQuestions(
        list.map((q: QuestionRow) => ({
          id: q.id,
          title: q.title ?? "",
          overview: q.overview ?? "",
          orderIndex: q.orderIndex,
        }))
      );
    }
    if (observersRes.ok) {
      const list = await observersRes.json();
      setObservers(
        list.map((o: ObserverRow) => ({
          id: o.id,
          name: o.name,
          department: o.department,
          email: o.email,
        }))
      );
    }
  }, [courseId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!canManageCourse(session?.user?.role ?? "")) {
      router.replace(`/dashboard/courses/${courseId}`);
    }
  }, [status, session, router, courseId]);

  useEffect(() => {
    if (status === "authenticated" && canManageCourse(session?.user?.role ?? "")) {
      load();
    }
  }, [load, status, session?.user?.role]);

  if (
    status === "loading" ||
    (status === "authenticated" && !canManageCourse(session?.user?.role ?? ""))
  ) {
    return <div className="mx-auto max-w-6xl px-4 py-10">불러오는 중...</div>;
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/courses/${courseId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: questionTitle,
        overview: questionOverview,
      }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "질문 등록 실패");
      return;
    }
    setQuestionTitle("");
    setQuestionOverview("");
    load();
  }

  async function saveQuestionEdit(id: string) {
    setError("");
    const res = await fetch(`/api/courses/${courseId}/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, overview: editOverview }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "질문 수정 실패");
      return;
    }
    setEditingId(null);
    load();
  }

  async function deleteQuestion(questionId: string) {
    if (!window.confirm("이 질문 문항을 삭제할까요? 관련 의견 기록도 함께 삭제됩니다.")) {
      return;
    }
    setError("");
    const res = await fetch(`/api/courses/${courseId}/questions/${questionId}`, {
      method: "DELETE",
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "삭제 실패");
      return;
    }
    load();
  }

  async function addObserver(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/courses/${courseId}/observers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: observerName }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "고객 등록 실패");
      return;
    }
    setObserverName("");
    load();
  }

  async function deleteObserver(observerId: string) {
    if (!window.confirm("이 고객을 목록에서 삭제할까요?")) {
      return;
    }
    setError("");
    const res = await fetch(`/api/courses/${courseId}/observers/${observerId}`, {
      method: "DELETE",
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "삭제 실패");
      return;
    }
    load();
  }

  async function saveAndReturn() {
    if (!editName.trim() || !editDateTime.trim() || weightSum === 0) {
      setError(
        `${SURVEY_NAME_LABEL}, ${SURVEY_DATETIME_LABEL}를 입력하고 ${SURVEY_WEIGHT_LABEL} 합계는 0보다 커야 합니다.`
      );
      return;
    }

    setSaving(true);
    setError("");
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        semester: editDateTime.trim(),
        weightPeer,
        weightObserver,
        weightLead,
      }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    setSaving(false);
    if (!res.ok) {
      setError(json?.error ?? "저장 실패");
      return;
    }
    router.push(`/dashboard/courses/${courseId}`);
    router.refresh();
  }

  const weightSum = weightPeer + weightObserver + weightLead;

  if (!courseName && !editName) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        {error ? (
          <>
            <p className="text-red-600">{error}</p>
            <p className="mt-2 text-sm text-zinc-600">
              개발 서버를 중지한 뒤{" "}
              <code className="rounded bg-zinc-100 px-1">npm run db:push</code> 와{" "}
              <code className="rounded bg-zinc-100 px-1">npm run db:generate</code>를
              실행하고 서버를 다시 시작해 주세요.
            </p>
          </>
        ) : (
          "불러오는 중..."
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{SURVEY_EDIT_LABEL}</h1>
          <p className="mt-1 text-zinc-600">{courseName}</p>
        </div>
        <button
          type="button"
          onClick={saveAndReturn}
          disabled={
            saving || weightSum === 0 || !editName.trim() || !editDateTime.trim()
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : `${SURVEY_INFO_LABEL} 저장`}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">{SURVEY_LABEL} 기본 정보</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder={SURVEY_NAME_LABEL}
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder={SURVEY_DATETIME_LABEL}
            required
            value={editDateTime}
            onChange={(e) => setEditDateTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        {courseJoinUrl && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold">접속 링크 (고객 공통)</p>
            <p className="mt-2 break-all font-mono text-xs text-zinc-700">{courseJoinUrl}</p>
            <div className="mt-3">
              <LinkActions url={courseJoinUrl} label={editName || courseName} />
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">{SURVEY_WEIGHT_LABEL} 조정 (%)</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              {CUSTOMER_EVAL_LABEL}
              <input
                type="number"
                min={0}
                max={100}
                value={weightPeer}
                onChange={(e) => setWeightPeer(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              보조 가중치
              <input
                type="number"
                min={0}
                max={100}
                value={weightObserver}
                onChange={(e) => setWeightObserver(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              {MANAGER_EVAL_LABEL}
              <input
                type="number"
                min={0}
                max={100}
                value={weightLead}
                onChange={(e) => setWeightLead(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">입력 합계: {weightSum}% (저장 시 100%로 정규화)</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>{ADD_QUESTION_LABEL}</strong>로 조사 질문을 등록·편집합니다. 평가 고객은{" "}
        <Link href="/login/customer" className="underline">
          고객 접속 화면
        </Link>
        에서 이름만 입력해 접속합니다.
      </div>

      <div className="mb-8 space-y-4">
        <form
          onSubmit={addQuestion}
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <p className="text-sm font-medium">{ADD_QUESTION_LABEL}</p>
          <input
            placeholder={QUESTION_TITLE_LABEL}
            required
            value={questionTitle}
            onChange={(e) => setQuestionTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder={QUESTION_CONTENT_LABEL}
            required
            rows={3}
            value={questionOverview}
            onChange={(e) => setQuestionOverview(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            {ADD_QUESTION_LABEL}
          </button>
        </form>
        <QuestionTable
          rows={questions}
          editingId={editingId}
          editTitle={editTitle}
          editOverview={editOverview}
          onEditStart={(row) => {
            setEditingId(row.id);
            setEditTitle(row.title);
            setEditOverview(row.overview);
          }}
          onEditCancel={() => setEditingId(null)}
          onEditTitleChange={setEditTitle}
          onEditOverviewChange={setEditOverview}
          onEditSave={saveQuestionEdit}
          onDelete={deleteQuestion}
        />
      </div>

      <div className="space-y-4">
        <form onSubmit={addObserver} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label className="text-sm font-medium">고객 추가 (이름만)</label>
            <input
              placeholder="평가 고객 이름"
              required
              value={observerName}
              onChange={(e) => setObserverName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            고객 추가
          </button>
        </form>
        <CustomerTable rows={observers} onDelete={deleteObserver} />
      </div>
    </div>
  );
}
