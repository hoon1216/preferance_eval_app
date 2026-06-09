"use client";

import { CourseEditLayout } from "@/components/course-edit-layout";
import { SurveyFormBuilder } from "@/components/survey-form-builder";
import { SURVEY_QUESTION_EDIT_SECTION_LABEL } from "@/lib/ui-labels";
import { useProfessorCourseGuard } from "@/lib/use-professor-course-guard";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function CourseFormEditPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { loading: guardLoading } = useProfessorCourseGuard(courseId);
  const [courseName, setCourseName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) {
      const json = await res.json();
      setCourseName(json.course.name ?? "");
    }
  }, [courseId]);

  useEffect(() => {
    if (!guardLoading) load();
  }, [load, guardLoading]);

  if (guardLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-10">불러오는 중...</div>;
  }

  return (
    <CourseEditLayout
      courseId={courseId}
      title={SURVEY_QUESTION_EDIT_SECTION_LABEL}
      courseName={courseName}
    >
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">
          구글 폼과 같이 섹션을 나누고 문항 유형을 선택해 조사 내용을 구성합니다.
          변경 사항은 자동으로 저장됩니다.
        </p>
        <SurveyFormBuilder courseId={courseId} />
      </section>
    </CourseEditLayout>
  );
}
