"use client";

import { CommentModal } from "@/components/comment-modal";
import {
  evaluationContentsFromParts,
  formatScoreDisplay,
} from "@/lib/evaluation-display";
import { FeedbackPdfButton } from "@/components/feedback-pdf-button";
import { downloadFeedbackPdf } from "@/lib/download-feedback-pdf";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import {
  hasSubmittedLeadEvaluation,
  hasSubmittedObserverEvaluation,
  isProfessorEvaluationSubmitted,
  leadEvaluationFromPresentation,
  observerEvaluationFromPresentation,
  professorEvaluationForModal,
  submittedLeadEvaluation,
  submittedObserverEvaluation,
} from "@/lib/professor-evaluation-display";
import {
  assignmentBodyCell,
  assignmentHeaderCell,
  bodyCell,
  commentBodyCell,
  commentBodyCellStacked,
  commentHeaderCell,
  COMMENT_GRID_PROFESSOR,
  EVALUATION_TABLE_MIN_WIDTH,
  EVALUATION_TABLE_SPLIT,
  indexBodyCell,
  indexHeaderCell,
  nameBodyCell,
  nameHeaderCell,
  isAssignmentRegistered,
  pillBlueActive,
  pillBlueMuted,
  pillClass,
  pillGreenActive,
  pillGreenMuted,
  pillGreyActive,
  pillGreyMuted,
  pillNavyActive,
  pillNavyMuted,
  pillVioletActive,
  pillVioletMuted,
  LEFT_LIST_GRID,
  ROW_MIN,
} from "@/lib/evaluation-ui";
import Link from "next/link";
import { useState } from "react";

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
  presenter: { name: string; studentId: string | null };
  observerProfessorComment: string | null;
  observerProfessorReason?: string | null;
  observerProfessorSuggestions?: string | null;
  observerEvaluationIsDraft?: boolean;
  professorComment: string | null;
  professorReason?: string | null;
  professorSuggestions?: string | null;
  professorEvaluationIsDraft?: boolean;
  evaluations: {
    empathyScore: number;
    reason: string;
    suggestions: string;
    isDraft?: boolean;
    evaluator: { name: string };
  }[];
};

type CourseInfo = {
  id: string;
  name: string;
  semester: string;
  weightPeer: number;
  weightObserver: number;
  weightLead: number;
};

type ModalState = {
  title: string;
  items: { reason: string; suggestions: string }[];
  emptyMessage: string;
};

function hasFeedbackPdf(p: Presentation) {
  const submitted = submittedEvaluations(p.evaluations);
  return (
    submitted.length > 0 ||
    hasSubmittedObserverEvaluation(p) ||
    hasSubmittedLeadEvaluation(p)
  );
}

export function ProfessorEvaluationView({
  course,
  presentations,
  courseId,
  professorName,
  showEditButton = true,
  evaluateLinkMode = "none",
}: {
  course: CourseInfo;
  presentations: Presentation[];
  courseId: string;
  professorName?: string | null;
  showEditButton?: boolean;
  /** observer: 참관교수, lead: 담당교수 평가 입력 */
  evaluateLinkMode?: "observer" | "lead" | "none";
}) {
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

  const tableActionBtn =
    "rounded-full border-2 border-zinc-800 px-4 py-1 text-xs font-semibold hover:bg-zinc-50";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <p className="mt-1 text-zinc-600">{course.semester}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {professorName && (
            <span className="text-sm text-zinc-700">담당교수 {professorName}</span>
          )}
          {showEditButton && (
            <Link
              href={`/dashboard/courses/${courseId}/edit`}
              className={tableActionBtn}
            >
              편집
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <a
          href={`/api/courses/${courseId}/export-scores`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          점수 엑셀 출력
        </a>
        {presentations.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              for (const p of presentations) {
                if (!hasFeedbackPdf(p)) continue;
                const result = await downloadFeedbackPdf(p.id);
                if (!result.ok) {
                  window.alert(`${p.presenter.name}: ${result.error}`);
                  break;
                }
              }
            }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            코멘트 PDF 출력
          </button>
        )}
      </div>

      <div className="relative overflow-x-auto rounded-xl border-2 border-zinc-800">
        <div
          className={`grid ${EVALUATION_TABLE_MIN_WIDTH} border-b-2 border-zinc-800 ${EVALUATION_TABLE_SPLIT}`}
        >
          <h2 className="px-4 py-3 text-center text-sm font-semibold lg:border-r lg:border-r-zinc-800">
            평가 과제 목록
          </h2>
          <h2 className="px-4 py-3 text-center text-sm font-semibold">
            평가 코멘트
          </h2>
        </div>

        <div className={`grid ${EVALUATION_TABLE_MIN_WIDTH} ${EVALUATION_TABLE_SPLIT} ${ROW_MIN}`}>
          <div className={`grid ${LEFT_LIST_GRID} lg:border-r lg:border-r-zinc-200`}>
            <div className={indexHeaderCell}>#</div>
            <div className={nameHeaderCell}>이름</div>
            <div className={nameHeaderCell}>학번</div>
            <div className={assignmentHeaderCell}>과제</div>
            <div className={nameHeaderCell}>발표자료</div>
            <div className={nameHeaderCell}>평가</div>
          </div>
          <div className={COMMENT_GRID_PROFESSOR}>
            <div className={commentHeaderCell}>학생</div>
            <div className={commentHeaderCell}>참관교수</div>
            <div className={commentHeaderCell}>담당교수</div>
            <div className={commentHeaderCell}>합산점수</div>
            <div className={commentHeaderCell}>PDF</div>
          </div>
        </div>

        {presentations.length === 0 ? (
          <p className="border-t border-zinc-200 px-4 py-10 text-center text-zinc-500">
            등록된 학생이 없습니다.
          </p>
        ) : (
          presentations.map((p, i) => {
            const registered = isAssignmentRegistered(p);
            const submitted = submittedEvaluations(p.evaluations);
            const pdfReady = hasFeedbackPdf(p);
            const hasMaterial = Boolean(p.hasPresentationPdf);

            const peerVivid = submitted.length > 0;
            const observerEval = observerEvaluationFromPresentation(p);
            const leadEval = leadEvaluationFromPresentation(p);
            const observerVivid = hasSubmittedObserverEvaluation(p);
            const professorVivid = hasSubmittedLeadEvaluation(p);

            const myProfessorEval =
              evaluateLinkMode === "observer" ? observerEval : leadEval;
            const hasEvaluated =
              evaluateLinkMode !== "none" &&
              isProfessorEvaluationSubmitted(myProfessorEval);
            const hasDraft =
              evaluateLinkMode !== "none" &&
              !hasEvaluated &&
              myProfessorEval.isDraft &&
              (myProfessorEval.empathyScore != null ||
                Boolean(myProfessorEval.reason.trim()) ||
                Boolean(myProfessorEval.suggestions.trim()));
            const evaluateHref =
              evaluateLinkMode === "observer"
                ? `/presentations/${p.id}/observer-evaluate`
                : `/presentations/${p.id}/professor-evaluate`;

            return (
              <div
                key={p.id}
                className={`grid ${EVALUATION_TABLE_MIN_WIDTH} ${EVALUATION_TABLE_SPLIT} ${ROW_MIN}`}
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
                    {registered ? (
                      <span className="line-clamp-2 font-medium">{p.title}</span>
                    ) : (
                      <span className="text-xs text-zinc-400 opacity-75">
                        미등록
                      </span>
                    )}
                  </div>
                  <div className={bodyCell}>
                    {hasMaterial ? (
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
                    {evaluateLinkMode === "none" ? (
                      <span
                        className={`${pillClass(false, false)} ${pillGreenMuted}`}
                        title="평가 권한이 없습니다."
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
                    ) : (
                      <Link
                        href={evaluateHref}
                        className={`${pillClass(true, true)} ${pillGreenActive}`}
                      >
                        {hasDraft ? "이어서 평가" : "평가 하기"}
                      </Link>
                    )}
                  </div>
                </div>

                <div className={`${COMMENT_GRID_PROFESSOR} items-stretch ${ROW_MIN}`}>
                  <div className={commentBodyCellStacked}>
                    <span className="text-xs font-semibold leading-none text-zinc-800">
                      {registered
                        ? `${formatScoreDisplay(p.peerAverage)} / 10`
                        : "—"}
                    </span>
                    <button
                      type="button"
                      disabled={!registered || !peerVivid}
                      onClick={() => registered && peerVivid && openPeerComments(p)}
                      className={`${pillClass(peerVivid, registered && peerVivid)} ${
                        peerVivid ? pillGreenActive : pillGreenMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCellStacked}>
                    <span className="text-xs font-semibold leading-none text-zinc-800">
                      {registered
                        ? `${formatScoreDisplay(p.observerProfessorScore)} / 10`
                        : "—"}
                    </span>
                    <button
                      type="button"
                      disabled={!registered || !observerVivid}
                      onClick={() =>
                        registered && observerVivid && openObserverComment(p)
                      }
                      className={`${pillClass(observerVivid, registered && observerVivid)} ${
                        observerVivid ? pillBlueActive : pillBlueMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCellStacked}>
                    <span className="text-xs font-semibold leading-none text-zinc-800">
                      {registered
                        ? `${formatScoreDisplay(p.professorScore)} / 10`
                        : "—"}
                    </span>
                    <button
                      type="button"
                      disabled={!registered || !professorVivid}
                      onClick={() =>
                        registered && professorVivid && openProfessorComment(p)
                      }
                      className={`${pillClass(professorVivid, registered && professorVivid)} ${
                        professorVivid ? pillNavyActive : pillNavyMuted
                      }`}
                    >
                      코멘트
                    </button>
                  </div>
                  <div className={commentBodyCell}>
                    <span className="text-[0.9rem] font-semibold leading-none text-zinc-800">
                      {registered
                        ? `${formatScoreDisplay(p.finalGrade)} / 10`
                        : "—"}
                    </span>
                  </div>
                  <div className={commentBodyCell}>
                    <FeedbackPdfButton
                      presentationId={p.id}
                      disabled={!registered || !pdfReady}
                      disabledTitle={
                        !registered
                          ? "과제 등록 후 이용할 수 있습니다."
                          : "평가 코멘트가 등록되면 다운로드할 수 있습니다."
                      }
                      className={`${pillClass(registered && pdfReady, registered && pdfReady)} ${
                        registered && pdfReady ? pillGreyActive : pillGreyMuted
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        평가 비중: 동료 {Math.round(course.weightPeer)}% · 참관 교수{" "}
        {Math.round(course.weightObserver)}% · 담당 교수{" "}
        {Math.round(course.weightLead)}%
      </p>

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
