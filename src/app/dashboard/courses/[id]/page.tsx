"use client";

import { ProfessorEvaluationView } from "@/components/professor-evaluation-view";
import { StudentEvaluationView } from "@/components/student-evaluation-view";
import { canViewCourseResults, isStudent } from "@/lib/permissions";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type Presentation = {
  id: string;
  title: string | null;
  overview: string | null;
  hasPresentationPdf?: boolean;
  peerAverage: number | null;
  observerProfessorScore: number | null;
  professorScore: number | null;
  finalGrade: number | null;
  rank: number | null;
  observerProfessorComment: string | null;
  professorComment: string | null;
  presenter: { id: string; name: string; studentId: string | null };
  evaluations: {
    evaluatorId: string;
    isDraft?: boolean;
    empathyScore: number;
    reason: string;
    suggestions: string;
    evaluator: { name: string };
  }[];
};

type CourseData = {
  course: {
    id: string;
    name: string;
    semester: string;
    weightPeer: number;
    weightObserver: number;
    weightLead: number;
    professorName?: string;
  };
  presentations: Presentation[];
  viewerRole?: string;
};

export default function EvaluationResultsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { data: session } = useSession();
  const [data, setData] = useState<CourseData | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) {
      setData(await res.json());
      return;
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    setLoadError(body?.error ?? "평가 정보를 불러오지 못했습니다.");
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loadError ? (
          <p className="text-red-600">{loadError}</p>
        ) : (
          "불러오는 중..."
        )}
      </div>
    );
  }

  const { course, presentations } = data;
  const role = data.viewerRole ?? session?.user?.role;

  if (isStudent(role ?? "")) {
    return (
      <StudentEvaluationView course={course} presentations={presentations} />
    );
  }

  if (!canViewCourseResults(role ?? "")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">
        이 평가에 접근할 권한이 없습니다.
      </div>
    );
  }

  return (
    <ProfessorEvaluationView
      course={course}
      presentations={presentations}
      courseId={courseId}
      professorName={course.professorName ?? session?.user?.name}
      showEditButton={role === "PROFESSOR"}
      evaluateLinkMode={
        role === "OBSERVER_PROFESSOR"
          ? "observer"
          : role === "PROFESSOR"
            ? "lead"
            : "none"
      }
    />
  );
}
