"use client";

import { SurveyProfessorOverview } from "@/components/survey-professor-overview";
import { SurveyRespondForm } from "@/components/survey-respond-form";
import { ProfessorEvaluationView } from "@/components/professor-evaluation-view";
import { canViewCourseResults, isObserverProfessor } from "@/lib/permissions";
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
  presenter?: {
    id: string;
    name: string;
    birthDate: string | null;
    gender: string | null;
  } | null;
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
  const [hasSurveyForm, setHasSurveyForm] = useState(false);
  const [surveyChecked, setSurveyChecked] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    const [courseRes, formRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/survey-form`),
    ]);

    if (courseRes.ok) {
      setData(await courseRes.json());
    } else {
      const body = (await courseRes.json().catch(() => null)) as {
        error?: string;
      } | null;
      setLoadError(body?.error ?? "조사 정보를 불러오지 못했습니다.");
    }

    if (formRes.ok) {
      const form = await formRes.json();
      setHasSurveyForm((form.sections ?? []).length > 0);
    }
    setSurveyChecked(true);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!surveyChecked || (!data && !loadError)) {
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

  const role = data?.viewerRole ?? session?.user?.role;
  const course = data?.course;

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">
        {loadError || "조사 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  if (isObserverProfessor(role ?? "")) {
    return <SurveyRespondForm course={course} />;
  }

  if (!canViewCourseResults(role ?? "")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">
        이 조사에 접근할 권한이 없습니다.
      </div>
    );
  }

  if (hasSurveyForm) {
    return <SurveyProfessorOverview course={course} />;
  }

  const presentations = data?.presentations ?? [];

  return (
    <ProfessorEvaluationView
      course={course}
      presentations={presentations}
      courseId={courseId}
      professorName={course.professorName ?? session?.user?.name}
      showEditButton={role === "PROFESSOR"}
      evaluateLinkMode={role === "PROFESSOR" ? "lead" : "none"}
    />
  );
}
