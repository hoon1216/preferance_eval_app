"use client";

import { LinkActions } from "@/components/link-actions";
import { CourseEditLayout } from "@/components/course-edit-layout";
import {
  SURVEY_BASIC_EDIT_SECTION_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_INFO_LABEL,
  SURVEY_LIST_LABEL,
  SURVEY_NAME_LABEL,
} from "@/lib/ui-labels";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { useProfessorCourseGuard } from "@/lib/use-professor-course-guard";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function CourseBasicEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { loading: guardLoading } = useProfessorCourseGuard(courseId);
  const [courseName, setCourseName] = useState("");
  const [courseJoinUrl, setCourseJoinUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) {
      const json = await res.json();
      setCourseName(json.course.name ?? "");
      setEditName(json.course.name ?? "");
      setEditDateTime(json.course.semester ?? "");
      setCourseJoinUrl(json.course.joinUrl ?? "");
    } else {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "조사 정보를 불러오지 못했습니다.");
    }
  }, [courseId]);

  useEffect(() => {
    if (!guardLoading) load();
  }, [load, guardLoading]);

  async function saveAndReturn() {
    if (!editName.trim() || !editDateTime.trim()) {
      setError(`${SURVEY_NAME_LABEL}과 ${SURVEY_DATETIME_LABEL}를 입력해주세요.`);
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

  if (guardLoading || (!courseName && !editName && !error)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        {error ? <p className="text-red-600">{error}</p> : "불러오는 중..."}
      </div>
    );
  }

  return (
    <CourseEditLayout
      courseId={courseId}
      title={SURVEY_BASIC_EDIT_SECTION_LABEL}
      courseName={courseName}
      backHref="/dashboard"
      backLabel={SURVEY_LIST_LABEL}
      action={
        <button
          type="button"
          onClick={saveAndReturn}
          disabled={saving || !editName.trim() || !editDateTime.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : `${SURVEY_INFO_LABEL} 저장`}
        </button>
      }
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">{SURVEY_NAME_LABEL}</label>
            <input
              placeholder={SURVEY_NAME_LABEL}
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{SURVEY_DATETIME_LABEL}</label>
            <input
              placeholder={SURVEY_DATETIME_LABEL}
              required
              value={editDateTime}
              onChange={(e) => setEditDateTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {courseJoinUrl && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold">접속 링크</p>
            <p className="mt-2 break-all font-mono text-xs text-zinc-700">
              {courseJoinUrl}
            </p>
            <div className="mt-3">
              <LinkActions url={courseJoinUrl} label={editName || courseName} />
            </div>
          </div>
        )}
      </section>
    </CourseEditLayout>
  );
}
