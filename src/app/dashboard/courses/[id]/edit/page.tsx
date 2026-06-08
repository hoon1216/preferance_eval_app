"use client";

import { LinkActions } from "@/components/link-actions";
import {
  CUSTOMER_EVAL_LABEL,
  MANAGER_EVAL_LABEL,
  PARTICIPATION_LABEL,
  PARTICIPATION_TITLE_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_EDIT_LABEL,
  SURVEY_INFO_LABEL,
  SURVEY_LABEL,
  SURVEY_NAME_LABEL,
  SURVEY_WEIGHT_LABEL,
  TEAM_MEMBER_EVAL_LABEL,
} from "@/lib/ui-labels";
import { displayOrUnregistered } from "@/lib/default-password";
import { GENDER_OPTIONS, formatGender } from "@/lib/gender-labels";
import { canManageCourse } from "@/lib/permissions";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { Gender } from "@prisma/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type StudentRow = {
  id: string;
  name: string;
  birthDate: string | null;
  gender: Gender | null;
  occupation: string | null;
  residenceRegion: string | null;
  familyCount: number | null;
  notes: string | null;
  taskTitle: string | null;
  presentationId: string | null;
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
    (variant === "student" ? 9 : 4) + (showDelete ? 1 : 0);

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
                <th className="px-4 py-3">생년월일</th>
                <th className="px-4 py-3">성별</th>
                <th className="px-4 py-3">직업</th>
                <th className="px-4 py-3">거주지역</th>
                <th className="px-4 py-3">가족수</th>
                <th className="px-4 py-3">기타사항</th>
                <th className="px-4 py-3">{PARTICIPATION_TITLE_LABEL}</th>
                <th className="px-4 py-3">조사내용</th>
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
                      {displayOrUnregistered((row as StudentRow).birthDate)}
                    </td>
                    <td className="px-4 py-3">
                      {formatGender((row as StudentRow).gender)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).occupation)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).residenceRegion)}
                    </td>
                    <td className="px-4 py-3">
                      {(row as StudentRow).familyCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[12rem] truncate" title={(row as StudentRow).notes ?? ""}>
                      {displayOrUnregistered((row as StudentRow).notes)}
                    </td>
                    <td className="px-4 py-3">
                      {displayOrUnregistered((row as StudentRow).taskTitle)}
                    </td>
                    <td className="px-4 py-3">
                      {(row as StudentRow).presentationId ? (
                        <Link
                          href={`/presentations/${(row as StudentRow).presentationId}/prep`}
                          className="text-blue-600 hover:underline"
                        >
                          {(row as StudentRow).taskTitle ? "편집" : "등록"}
                        </Link>
                      ) : (
                        "—"
                      )}
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
  const [studentBirthDate, setStudentBirthDate] = useState("");
  const [studentGender, setStudentGender] = useState<Gender | "">("");
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
      setError(json?.error ?? `${SURVEY_INFO_LABEL}를 불러오지 못했습니다.`);
    }
    if (studentsRes.ok) {
      const list = await studentsRes.json();
      setStudents(
        list.map((s: StudentRow) => ({
          id: s.id,
          name: s.name,
          birthDate: s.birthDate,
          gender: s.gender,
          occupation: s.occupation,
          residenceRegion: s.residenceRegion,
          familyCount: s.familyCount,
          notes: s.notes,
          taskTitle: s.taskTitle ?? null,
          presentationId: s.presentationId ?? null,
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
      body: JSON.stringify({
        name: studentName,
        birthDate: studentBirthDate,
        gender: studentGender,
      }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "고객 등록 실패");
      return;
    }
    setStudentName("");
    setStudentBirthDate("");
    setStudentGender("");
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
      setError(json?.error ?? "팀멤버 등록 실패");
      return;
    }
    setObserverName("");
    load();
  }

  async function deleteObserver(observerId: string) {
    if (!window.confirm("이 팀멤버를 목록에서 삭제할까요?")) {
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
    if (!window.confirm(`이 고객을 목록에서 삭제할까요? 관련 ${PARTICIPATION_LABEL}·의견 기록도 함께 삭제됩니다.`)) {
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
      setError(`${SURVEY_NAME_LABEL}, ${SURVEY_DATETIME_LABEL}를 입력하고 ${SURVEY_WEIGHT_LABEL} 합계는 0보다 커야 합니다.`);
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
            saving ||
            weightSum === 0 ||
            !editName.trim() ||
            !editDateTime.trim()
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
            <p className="text-sm font-semibold">접속 링크 (고객·팀멤버 공통)</p>
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
              {CUSTOMER_EVAL_LABEL}(동료) 평균
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
              {TEAM_MEMBER_EVAL_LABEL}
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
        고객 추가 시 <strong>이름·생년월일·성별</strong>은 필수입니다. 고객은 회원가입 없이{" "}
        <Link href="/login/customer" className="underline">
          고객 접속 화면
        </Link>
        에서 이름만 입력해 접속합니다. 조사 내용은 <strong>조사내용</strong> 열에서 등록합니다.
      </div>

      <div className="mb-8 space-y-4">
        <form
          onSubmit={addStudent}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="min-w-[10rem] flex-1">
            <label className="text-sm font-medium">
              이름 <span className="text-red-600">*</span>
            </label>
            <input
              placeholder="고객 이름"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="text-sm font-medium">
              생년월일 <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              required
              value={studentBirthDate}
              onChange={(e) => setStudentBirthDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label className="text-sm font-medium">
              성별 <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={studentGender}
              onChange={(e) => setStudentGender(e.target.value as Gender | "")}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            고객 추가
          </button>
        </form>
        <ParticipantTable
          title="고객 목록"
          rows={students}
          variant="student"
          showDelete
          onDelete={deleteStudent}
        />
      </div>

      <div className="space-y-4">
        <form onSubmit={addObserver} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">팀멤버 추가 (이름만)</label>
            <input
              placeholder="팀멤버 이름"
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
            팀멤버 추가
          </button>
        </form>
        <ParticipantTable
          title="팀멤버 목록"
          rows={observers}
          variant="observer"
          showDelete
          onDelete={deleteObserver}
        />
      </div>
    </div>
  );
}
