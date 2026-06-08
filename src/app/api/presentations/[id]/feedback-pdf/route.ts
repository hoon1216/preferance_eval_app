import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import {
  isProfessorEvaluationSubmitted,
  leadEvaluationFromPresentation,
  observerEvaluationFromPresentation,
} from "@/lib/professor-evaluation-display";
import { evaluationContentFromParts } from "@/lib/evaluation-display";
import { listSubmittedEvaluations } from "@/lib/evaluation-persistence";
import { mergeProfessorFields } from "@/lib/presentation-professor-fields";
import { prisma } from "@/lib/prisma";
import { CombinedFeedbackPdfDocument } from "@/lib/pdf/combined-feedback-document";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    return await getFeedbackPdf(_request, { params });
  } catch (err) {
    console.error("GET /feedback-pdf failed:", err);
    return NextResponse.json(
      { error: "PDF 생성 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function getFeedbackPdf(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: presentationId } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId },
    include: {
      course: true,
      presenter: { select: { name: true, studentId: true } },
    },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const withProfessorFields = await mergeProfessorFields(
    presentation,
    presentationId
  );

  const isPresenter = presentation.presenterId === session.user.id;
  const canViewCourse = await userCanAccessCourse(
    presentation.courseId,
    session.user.id,
    session.user.role
  );
  const isFacultyViewer =
    canViewCourse && canViewCourseResults(session.user.role);

  if (!isFacultyViewer && !isPresenter) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const observerEval = observerEvaluationFromPresentation(withProfessorFields);
  const leadEval = leadEvaluationFromPresentation(withProfessorFields);
  const peerEvaluations = await listSubmittedEvaluations(presentationId);

  const buffer = await renderToBuffer(
    CombinedFeedbackPdfDocument({
      courseName: presentation.course.name,
      semester: presentation.course.semester,
      presenterName: presentation.presenter.name,
      presenterStudentId: presentation.presenter.studentId ?? "미등록",
      title: presentation.title ?? "제목 미입력",
      studentEvaluations: peerEvaluations.map((e) =>
        evaluationContentFromParts(e.reason, e.suggestions)
      ),
      observerEvaluation: isProfessorEvaluationSubmitted(observerEval)
        ? evaluationContentFromParts(
            observerEval.reason,
            observerEval.suggestions
          )
        : null,
      professorEvaluation: isProfessorEvaluationSubmitted(leadEval)
        ? evaluationContentFromParts(leadEval.reason, leadEval.suggestions)
        : null,
    })
  );

  const filename = encodeURIComponent(
    `${presentation.presenter.name}_평가종합_${presentation.title ?? "발표"}.pdf`
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
