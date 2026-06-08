"use client";

import { CommentModal } from "@/components/comment-modal";
import { evaluationContentsFromParts } from "@/lib/evaluation-display";
import { FeedbackPdfButton } from "@/components/feedback-pdf-button";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import {
  hasSubmittedLeadEvaluation,
  hasSubmittedObserverEvaluation,
  professorEvaluationForModal,
  submittedLeadEvaluation,
  submittedObserverEvaluation,
} from "@/lib/professor-evaluation-display";
import {
  assignmentBodyCell,
  assignmentHeaderCell,
  bodyCell,
  commentBodyCell,
  commentHeaderCell,
  COMMENT_GRID_STUDENT,
  EVALUATION_TABLE_MIN_WIDTH,
  EVALUATION_TABLE_SPLIT,
  indexBodyCell,
  indexHeaderCell,
  isAssignmentRegistered,
  nameBodyCell,
  nameHeaderCell,
  pillBlueActive,
  pillBlueMuted,
  pillClass,
  pillGreenActive,
  pillGreenMuted,
  pillGreyActive,
  pillGreyMuted,
  pillNavyActive,
  pillNavyMuted,
  LEFT_LIST_GRID,
  pillVioletActive,
  pillVioletMuted,
  ROW_MIN,
} from "@/lib/evaluation-ui";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

type Presentation = {
  id: string;
  title: string | null;
  overview: string | null;
  hasPresentationPdf?: boolean;
  presenter: { id: string; name: string; studentId: string | null };
  evaluations: {
    evaluatorId: string;
    isDraft?: boolean;
    empathyScore: number;
    reason: string;
    suggestions: string;
    evaluator: { name: string };
  }[];
  observerProfessorScore?: number | null;
  observerProfessorComment?: string | null;
  observerProfessorReason?: string | null;
  observerProfessorSuggestions?: string | null;
  observerEvaluationIsDraft?: boolean;
  professorScore?: number | null;
  professorComment?: string | null;
  professorReason?: string | null;
  professorSuggestions?: string | null;
  professorEvaluationIsDraft?: boolean;
};

type CourseInfo = {
  id: string;
  name: string;
  semester: string;
};

type ModalState = {
  title: string;
  items: { reason: string; suggestions: string }[];
  emptyMessage: string;
};

function hasSubmittedByUser(p: Presentation, userId: string | undefined) {
  if (!userId) return false;
  return p.evaluations.some((e) => e.evaluatorId === userId && !e.isDraft);
}

function hasPdfContent(p: Presentation) {
  const hasPeer = submittedEvaluations(p.evaluations).length > 0;
  return (
    hasPeer ||
    hasSubmittedObserverEvaluation(p) ||
    hasSubmittedLeadEvaluation(p)
  );
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
  const [modal, setModal] = useState<ModalState | null>(null);

  function openPeerComments(p: Presentation) {
    setModal({
      title: `${p.presenter.name} · 학생 평가`,
      items: evaluationContentsFromParts(
        submittedEvaluations(p.evaluations).map((e) => ({
          reason: e.reason,
          suggestions: e.suggestions,
        }))
      ),
      emptyMessage: "등록된 학생 평가 내용이 없습니다.",
    });
  }

  function openObserverComment(p: Presentation) {
    const evalData = submittedObserverEvaluation(p);
    setModal({
      title: `${p.presenter.name} · 참관 교수 평가`,
      items: evalData ? professorEvaluationForModal(evalData) : [],
      emptyMessage: "등록된 참관 교수 코멘트가 없습니다.",
    });
  }

  function openProfessorComment(p: Presentation) {
    const evalData = submittedLeadEvaluation(p);
    setModal({
      title: `${p.presenter.name} · 담당 교수 평가`,
      items: evalData ? professorEvaluationForModal(evalData) : [],
      emptyMessage: "등록된 담당 교수 코멘트가 없습니다.",
    });
  }

  const myPresentation = presentations.find((p) => p.presenter.id === userId);
  const myRegistered = myPresentation ? isAssignmentRegistered(myPresentation) : false;
  const myPdfMissing =
    myRegistered && myPresentation && !myPresentation.hasPresentationPdf;
  const showTableActions =
    myPdfMissing || Boolean(myPresentation && myRegistered);

  const tableActionBtn =
    "rounded-full border-2 border-zinc-800 px-4 py-1 text-xs font-semibold hover:bg-zinc-50";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{course.name}</h1>
        <p className="mt-1 text-zinc-600">{course.semester}</p>
      </div>

      {showTableActions && (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
          {myPdfMissing && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              과제 미첨부
            </span>
          )}
          {myPresentation && myRegistered && (
            <Link
              href={`/presentations/${myPresentation.id}/prep`}
              className={tableActionBtn}
            >
              등록과제 편집
            </Link>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border-2 border-zinc-800">
        <div className={EVALUATION_TABLE_MIN_WIDTH}>
          <div
            className={`grid border-b-2 border-zinc-800 ${EVALUATION_TABLE_SPLIT}`}
          >
            <h2 className="px-4 py-3 text-center text-sm font-semibold lg:border-r lg:border-r-zinc-800">
              평가 과제 목록
            </h2>
            <h2 className="px-4 py-3 text-center text-sm font-semibold">
              평가 코멘트
            </h2>
          </div>

        <div className={`grid w-full ${EVALUATION_TABLE_SPLIT} ${ROW_MIN}`}>
          <div className={`grid ${LEFT_LIST_GRID} lg:border-r lg:border-r-zinc-200`}>
            <div className={indexHeaderCell}>#</div>
            <div className={nameHeaderCell}>이름</div>
            <div className={nameHeaderCell}>학번</div>
            <div className={assignmentHeaderCell}>과제</div>
            <div className={nameHeaderCell}>발표자료</div>
            <div className={nameHeaderCell}>평가</div>
          </div>
          <div className={COMMENT_GRID_STUDENT}>
            <div className={commentHeaderCell}>학생</div>
            <div className={commentHeaderCell}>참관교수</div>
            <div className={commentHeaderCell}>담당교수</div>
            <div className={commentHeaderCell}>PDF</div>
          </div>
        </div>

        {presentations.length === 0 ? (
          <p className="border-t border-zinc-200 px-4 py-10 text-center text-zinc-500">
            등록된 학생이 없습니다.
          </p>
        ) : (
          presentations.map((p, i) => {
            const isSelf = p.presenter.id === userId;
            const registered = isAssignmentRegistered(p);
            const submitted = submittedEvaluations(p.evaluations);
            const hasEvaluated = hasSubmittedByUser(p, userId);
            const hasDraft =
              !hasEvaluated &&
              p.evaluations.some(
                (e) => e.evaluatorId === userId && e.isDraft
              );
            const pdfReady = hasPdfContent(p);

            const peerVivid = isSelf && submitted.length > 0;
            const observerVivid = isSelf && hasSubmittedObserverEvaluation(p);
            const professorVivid = isSelf && hasSubmittedLeadEvaluation(p);

            return (
              <div
                key={p.id}
                className={`grid w-full ${EVALUATION_TABLE_SPLIT} ${ROW_MIN}`}
              >
                <div
                  className={`grid ${LEFT_LIST_GRID} items-stretch lg:border-r lg:border-r-zinc-200 ${ROW_MIN}`}
                >
                  <div className={indexBodyCell}>{i + 1}</div>
                  <div className={nameBodyCell} title={p.presenter.name}>
                    {p.presenter.name}
                  </div>
                  <div className={nameBodyCell}>{p.presenter.studentId ?? "—"}</div>
                  <div className={assignmentBodyCell}>
                    {isSelf && !registered ? (
                      <Link
                        href={`/presentations/${p.id}/prep`}
                        className={`${pillClass(true, true)} ${pillGreenActive}`}
                      >
                        과제 등록하기
                      </Link>
                    ) : registered ? (
                      <span className="line-clamp-2">{p.title}</span>
                    ) : (
                      <span className="text-xs text-zinc-400 opacity-75">
                        미등록
                      </span>
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
                        발표자료
                      </a>
                    ) : (
                      <span
                        className={`${pillClass(false, false)} ${pillVioletMuted}`}
                        title="첨부된 발표 PDF가 없습니다."
                      >
                        발표자료
                      </span>
                    )}
                  </div>
                  <div className={bodyCell}>
                    {isSelf ? (
                      <span
                        className={`${pillClass(false, false)} ${pillGreenMuted}`}
                      >
                        평가 하기
                      </span>
                    ) : !registered ? (
                      <span
                        className={`${pillClass(false, false)} ${pillGreenMuted}`}
                        title="과제 등록 후 평가할 수 있습니다."
                      >
                        평가 하기
                      </span>
                    ) : hasEvaluated ? (
                      <span className="text-xs text-zinc-500">평가 완료</span>
                    ) : registered ? (
                      <Link
                        href={`/presentations/${p.id}/evaluate`}
                        className={`${pillClass(true, true)} ${pillGreenActive}`}
                      >
                        {hasDraft ? "이어서 평가" : "평가 하기"}
                      </Link>
                    ) : (
                      <span
                        className={`${pillClass(false, false)} ${pillGreenMuted}`}
                        title="과제 등록 후 평가할 수 있습니다."
                      >
                        평가 하기
                      </span>
                    )}
                  </div>
                </div>

                <div className={`${COMMENT_GRID_STUDENT} items-stretch ${ROW_MIN}`}>
                  <div className={commentBodyCell}>
                    <button
                      type="button"
                      disabled={!isSelf}
                      onClick={() => isSelf && openPeerComments(p)}
                      className={`${pillClass(peerVivid, isSelf)} ${
                        peerVivid ? pillGreenActive : pillGreenMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCell}>
                    <button
                      type="button"
                      disabled={!isSelf}
                      onClick={() => isSelf && openObserverComment(p)}
                      className={`${pillClass(observerVivid, isSelf)} ${
                        observerVivid ? pillBlueActive : pillBlueMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCell}>
                    <button
                      type="button"
                      disabled={!isSelf}
                      onClick={() => isSelf && openProfessorComment(p)}
                      className={`${pillClass(professorVivid, isSelf)} ${
                        professorVivid ? pillNavyActive : pillNavyMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCell}>
                    <FeedbackPdfButton
                      presentationId={p.id}
                      disabled={!isSelf || !pdfReady}
                      disabledTitle={
                        !isSelf
                          ? undefined
                          : "평가 코멘트가 등록되면 다운로드할 수 있습니다."
                      }
                      className={`${pillClass(isSelf && pdfReady, isSelf && pdfReady)} ${
                        isSelf && pdfReady ? pillGreyActive : pillGreyMuted
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      <CommentModal
        open={!!modal}
        title={modal?.title ?? ""}
        items={modal?.items}
        emptyMessage={modal?.emptyMessage}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
