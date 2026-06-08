import { auth } from "@/lib/auth";
import { ensureStudentEnrollment } from "@/lib/course-enrollment";
import {
  findMyEvaluation,
  isEvaluationSubmitted,
  listSubmittedEvaluations,
  upsertEvaluation,
} from "@/lib/evaluation-persistence";
import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  isValidCompletenessScore,
  normalizeCompletenessScore,
} from "@/lib/evaluation-labels";
import {
  canPeerEvaluate,
  isLeadProfessor,
  userCanAccessCourse,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const completenessScoreSchema = z
  .number()
  .min(1)
  .max(10)
  .refine(isValidCompletenessScore, {
    message: `${COMPLETENESS_LABEL} 점수는 0.5 단위로 선택해주세요.`,
  });

const finalSchema = z.object({
  draft: z.literal(false).optional(),
  empathyScore: completenessScoreSchema,
  reason: z.string().min(1, `${COMMENT_LABEL}을 입력해주세요.`),
  suggestions: z.string().optional(),
});

const draftSchema = z.object({
  draft: z.literal(true),
  empathyScore: completenessScoreSchema.optional(),
  reason: z.string().optional(),
  suggestions: z.string().optional(),
});

async function assertCanEvaluate(
  presentationId: string,
  evaluatorId: string
) {
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId },
    include: { course: true },
  });

  if (!presentation) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const registered =
    Boolean(presentation.title?.trim()) && Boolean(presentation.overview?.trim());

  if (!registered || presentation.status !== "READY") {
    return {
      error: NextResponse.json(
        { error: "과제가 등록된 발표만 평가할 수 있습니다." },
        { status: 400 }
      ),
    };
  }

  if (presentation.presenterId === evaluatorId) {
    return {
      error: NextResponse.json(
        { error: "본인 과제는 평가할 수 없습니다." },
        { status: 400 }
      ),
    };
  }

  const [enrollments, presenters] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseId: presentation.courseId },
      select: { studentId: true },
    }),
    prisma.presentation.findMany({
      where: { courseId: presentation.courseId },
      select: { presenterId: true },
    }),
  ]);

  const participantIds = new Set([
    ...enrollments.map((e) => e.studentId),
    ...presenters.map((p) => p.presenterId),
  ]);

  if (!participantIds.has(evaluatorId)) {
    return {
      error: NextResponse.json(
        { error: "이 평가에 등록된 학생만 평가할 수 있습니다." },
        { status: 403 }
      ),
    };
  }

  await ensureStudentEnrollment(presentation.courseId, evaluatorId);

  return { presentation };
}

export async function POST(request: Request, { params }: Params) {
  try {
    return await postEvaluation(request, { params });
  } catch (err) {
    console.error("POST /evaluations failed:", err);
    return NextResponse.json(
      { error: "평가 저장 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function postEvaluation(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canPeerEvaluate(session.user.role)) {
    return NextResponse.json({ error: "학생만 평가할 수 있습니다." }, { status: 403 });
  }

  const { id: presentationId } = await params;
  const access = await assertCanEvaluate(presentationId, session.user.id);
  if ("error" in access && access.error) return access.error;

  const body = await request.json();
  const isDraft = body.draft === true;

  if (isDraft) {
    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (await isEvaluationSubmitted(presentationId, session.user.id)) {
      return NextResponse.json(
        { error: "이미 평가를 제출했습니다. 제출 후에는 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    const result = await upsertEvaluation({
      presentationId,
      evaluatorId: session.user.id,
      empathyScore: normalizeCompletenessScore(parsed.data.empathyScore, 5) ?? 5,
      reason: parsed.data.reason ?? "",
      suggestions: "",
      isDraft: true,
    });

    if (result.error === "ALREADY_SUBMITTED") {
      return NextResponse.json(
        { error: "이미 평가를 제출했습니다. 제출 후에는 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(result.evaluation);
  }

  const parsed = finalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  if (await isEvaluationSubmitted(presentationId, session.user.id)) {
    return NextResponse.json({ error: "이미 평가를 제출했습니다." }, { status: 400 });
  }

  const result = await upsertEvaluation({
    presentationId,
    evaluatorId: session.user.id,
    empathyScore: parsed.data.empathyScore,
    reason: parsed.data.reason,
    suggestions: "",
    isDraft: false,
  });

  if (result.error === "ALREADY_SUBMITTED") {
    return NextResponse.json({ error: "이미 평가를 제출했습니다." }, { status: 400 });
  }

  return NextResponse.json(result.evaluation, { status: 201 });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    return await getEvaluations(_request, { params });
  } catch (err) {
    console.error("GET /evaluations failed:", err);
    return NextResponse.json(
      { error: "평가 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

async function getEvaluations(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: presentationId } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId },
    include: { course: true },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const mine = await findMyEvaluation(presentationId, session.user.id);
    return NextResponse.json(mine);
  }

  const canView =
    isLeadProfessor(session.user.role) &&
    presentation.course.professorId === session.user.id;

  const canViewAsObserver =
    session.user.role === "OBSERVER_PROFESSOR" &&
    (await userCanAccessCourse(
      presentation.courseId,
      session.user.id,
      session.user.role
    ));

  if (!canView && !canViewAsObserver) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const evaluations = await listSubmittedEvaluations(presentationId);
  return NextResponse.json(evaluations);
}
