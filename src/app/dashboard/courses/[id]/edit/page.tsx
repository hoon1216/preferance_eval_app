"use client";

import { LinkActions } from "@/components/link-actions";
import { DEFAULT_INITIAL_PASSWORD, displayOrUnregistered } from "@/lib/default-password";
import { canManageCourse } from "@/lib/permissions";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type StudentRow = {
  id: string;
  name: string;
  studentId: string | null;
  email: string | null;
  taskTitle: string | null;
};

type ObserverRow = {
  id: string;
  name: string;
  department: string | null;
  email: string | null;
};

function ParticipantTable({
  title,
  rows,
  variant,
  showDelete,
  onDelete,
}: {
  title: string;
  rows: StudentRow[] | ObserverRow[];
  variant: "student" | "observer";
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  const colCount =
    (variant === "student" ? 5 : 4) + (showDelete ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold">{title}</h2>
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="px-4 py-3 w-12">순번</th>
            <th className="px-4 py-3">이름</th>
            {variant === "student" ? (
              <>
                <th className="px-4 py-3">학번</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">과제 제목</th>
              </>
            ) : (
              <>
                <th className="px-4 py-3">학과</th>
                <th className="px-4 py-3">이메일</th>
              </>
            )}
            {showDelete && <th className="px-4 py-3 w-20">관리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-zinc-500">
                등록된 항목이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className="border-b border-zinc-100">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                {variant === "student" ? (
                  <>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).studentId)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).email)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).taskTitle)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as ObserverRow).department)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as ObserverRow).email)}
                    </td>
                  </>
                )}
                {showDelete && onDelete && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </td>
                )}
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
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [observers, setObservers] = useState<ObserverRow[]>([]);
  const [studentName, setStudentName] = useState("");
  const [observerName, setObserverName] = useState("");
  const [editName, setEditName] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [weightPeer, setWeightPeer] = useState(50);
  const [weightObserver, setWeightObserver] = useState(25);
  const [weightLead, setWeightLead] = useState(25);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [courseRes, studentsRes, observersRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/students`),
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
      setError(json?.error ?? "평가 정보를 불러오지 못했습니다.");
    }
    if (studentsRes.ok) {
      const list = await studentsRes.json();
      setStudents(
        list.map((s: StudentRow) => ({
          id: s.id,
          name: s.name,
          studentId: s.studentId,
          email: s.email,
          taskTitle: s.taskTitle ?? null,
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

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/courses/${courseId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: studentName }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "학생 등록 실패");
      return;
    }
    setStudentName("");
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
      setError(json?.error ?? "참관교수 등록 실패");
      return;
    }
    setObserverName("");
    load();
  }

  async function deleteObserver(observerId: string) {
    if (!window.confirm("이 참관교수를 목록에서 삭제할까요?")) {
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

  async function deleteStudent(studentId: string) {
    if (!window.confirm("이 학생을 목록에서 삭제할까요? 관련 과제·평가 기록도 함께 삭제됩니다.")) {
      return;
    }
    setError("");
    const res = await fetch(`/api/courses/${courseId}/students/${studentId}`, {
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
      setError("평가명, 평가 일시를 입력하고 평가 비중 합계는 0보다 커야 합니다.");
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
          <h1 className="text-2xl font-bold">평가 내용 편집</h1>
          <p className="mt-1 text-zinc-600">{courseName}</p>
        </div>
        <button
          type="button"
          onClick={saveAndReturn}
          disabled={
            saving ||
            weightSum === 0 ||
            !editName.trim() ||
            !editDateTime.trim()
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "평가 정보 저장"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">평가 기본 정보</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="평가명"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="평가 일시"
            required
            value={editDateTime}
            onChange={(e) => setEditDateTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        {courseJoinUrl && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold">접속 링크 (학생·참관교수 공통)</p>
            <p className="mt-2 break-all font-mono text-xs text-zinc-700">{courseJoinUrl}</p>
            <div className="mt-3">
              <LinkActions url={courseJoinUrl} label={editName || courseName} />
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">평가 비중 조정 (%)</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              학생 평가(동료) 평균
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
              참관 교수 평가
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
              담당 교수 평가
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
        초기 비밀번호는 <strong>{DEFAULT_INITIAL_PASSWORD}</strong> 입니다. 공통 접속 링크에서
        등록된 이름을 입력한 뒤 학생은 학번·이메일, 참관교수는 학과·이메일을 등록하고 비밀번호를
        개별 변경할 수 있습니다.
      </div>

      <div className="mb-8 space-y-4">
        <form onSubmit={addStudent} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">학생 추가 (이름만)</label>
            <input
              placeholder="학생 이름"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            학생 추가
          </button>
        </form>
        <ParticipantTable
          title="학생 목록"
          rows={students}
          variant="student"
          showDelete
          onDelete={deleteStudent}
        />
      </div>

      <div className="space-y-4">
        <form onSubmit={addObserver} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">참관교수 추가 (이름만)</label>
            <input
              placeholder="참관교수 이름"
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
            참관교수 추가
          </button>
        </form>
        <ParticipantTable
          title="참관교수 목록"
          rows={observers}
          variant="observer"
          showDelete
          onDelete={deleteObserver}
        />
      </div>
    </div>
  );
}
