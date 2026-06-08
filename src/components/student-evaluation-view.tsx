"use client";

import {
  ATTACHMENT_LABEL,
  CONTINUE_RATE_LABEL,
  QUESTION_CONTENT_LABEL,
  QUESTION_LIST_LABEL,
  QUESTION_TITLE_LABEL,
  RATE_ACTION_LABEL,
  RATE_COMPLETE_LABEL,
} from "@/lib/ui-labels";
import {
  assignmentBodyCell,
  assignmentHeaderCell,
  bodyCell,
  EVALUATION_TABLE_MIN_WIDTH,
  indexBodyCell,
  indexHeaderCell,
  isAssignmentRegistered,
  nameHeaderCell,
  pillClass,
  pillGreenActive,
  pillGreenMuted,
  pillVioletActive,
  pillVioletMuted,
  LEFT_LIST_GRID,
  ROW_MIN,
} from "@/lib/evaluation-ui";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Presentation = {
  id: string;
  title: string | null;
  overview: string | null;
  hasPresentationPdf?: boolean;
  evaluations: {
    evaluatorId: string;
    isDraft?: boolean;
  }[];
};

type CourseInfo = {
  id: string;
  name: string;
  semester: string;
};

function hasSubmittedByUser(p: Presentation, userId: string | undefined) {
  if (!userId) return false;
  return p.evaluations.some((e) => e.evaluatorId === userId && !e.isDraft);
}

function hasDraftByUser(p: Presentation, userId: string | undefined) {
  if (!userId) return false;
  return p.evaluations.some((e) => e.evaluatorId === userId && e.isDraft);
}

export function StudentEvaluationView({
  course,
  presentations,
}: {
  course: CourseInfo;
  presentations: Presentation[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{course.name}</h1>
        <p className="mt-1 text-zinc-600">{course.semester}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
        <div className={EVALUATION_TABLE_MIN_WIDTH}>
          <h2 className="border-b-2 border-zinc-800 px-4 py-3 text-center text-sm font-semibold">
            {QUESTION_LIST_LABEL}
          </h2>

          <div className={`grid w-full ${LEFT_LIST_GRID} ${ROW_MIN}`}>
            <div className={indexHeaderCell}>#</div>
            <div className={nameHeaderCell}>{QUESTION_TITLE_LABEL}</div>
            <div className={assignmentHeaderCell}>{QUESTION_CONTENT_LABEL}</div>
            <div className={nameHeaderCell}>{ATTACHMENT_LABEL}</div>
            <div className={nameHeaderCell}>의견</div>
          </div>

          {presentations.length === 0 ? (
            <p className="border-t border-zinc-200 px-4 py-10 text-center text-zinc-500">
              등록된 질문 문항이 없습니다.
            </p>
          ) : (
            presentations.map((p, i) => {
              const registered = isAssignmentRegistered(p);
              const hasEvaluated = hasSubmittedByUser(p, userId);
              const hasDraft = hasDraftByUser(p, userId);

              return (
                <div
                  key={p.id}
                  className={`grid w-full ${LEFT_LIST_GRID} items-stretch ${ROW_MIN}`}
                >
                  <div className={indexBodyCell}>{i + 1}</div>
                  <div className={assignmentBodyCell} title={p.title ?? ""}>
                    {registered ? (
                      <span className="line-clamp-2 font-medium">{p.title}</span>
                    ) : (
                      <span className="text-xs text-zinc-400">미등록</span>
                    )}
                  </div>
                  <div className={assignmentBodyCell} title={p.overview ?? ""}>
                    {registered ? (
                      <span className="line-clamp-2">{p.overview}</span>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className={bodyCell}>
                    {p.hasPresentationPdf ? (
                      <a
                        href={`/api/presentations/${p.id}/presentation-pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className={`${pillClass(true, true)} ${pillVioletActive}`}
                      >
                        {ATTACHMENT_LABEL}
                      </a>
                    ) : (
                      <span
                        className={`${pillClass(false, false)} ${pillVioletMuted}`}
                        title="첨부된 PDF가 없습니다."
                      >
                        {ATTACHMENT_LABEL}
                      </span>
                    )}
                  </div>
                  <div className={bodyCell}>
                    {!registered ? (
                      <span
                        className={`${pillClass(false, false)} ${pillGreenMuted}`}
                        title="질문이 등록되면 의견을 등록할 수 있습니다."
                      >
                        {RATE_ACTION_LABEL}
                      </span>
                    ) : hasEvaluated ? (
                      <span className="text-xs text-zinc-500">{RATE_COMPLETE_LABEL}</span>
                    ) : (
                      <Link
                        href={`/presentations/${p.id}/evaluate`}
                        className={`${pillClass(true, true)} ${pillGreenActive}`}
                      >
                        {hasDraft ? CONTINUE_RATE_LABEL : RATE_ACTION_LABEL}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
