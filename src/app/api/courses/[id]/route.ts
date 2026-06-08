import { auth } from "@/lib/auth";
import { ensureCourseAccessToken } from "@/lib/course-access";
import { enrichPresentationsForResults } from "@/lib/course-results";
import { mergeProfessorFieldsBatch } from "@/lib/presentation-professor-fields";
import { sortPresentationsByPresenterName } from "@/lib/sort-presentations";
import { normalizeWeights } from "@/lib/grades";
import { getCourseForUser, isLeadProfessor } from "@/lib/permissions";
import { presentationPdfFileExists } from "@/lib/presentation-pdf-storage";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await getCourseForUser(id, session.user.id, session.user.role);
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const leadProfessor = await prisma.user.findUnique({
    where: { id: course.professorId },
    select: { name: true },
  });

  const presentations = await prisma.presentation.findMany({
    where: { courseId: id },
    include: {
      presenter: { select: { id: true, name: true, studentId: true, email: true } },
      evaluations: {
        include: {
          evaluator: { select: { id: true, name: true, studentId: true } },
        },
      },
    },
  });

  const withProfessorFields = await mergeProfessorFieldsBatch(presentations);

  const enriched = enrichPresentationsForResults(withProfessorFields, {
    weightPeer: course.weightPeer,
    weightObserver: course.weightObserver,
    weightLead: course.weightLead,
  });

  const withPdfFlags = await Promise.all(
    enriched.map(async (p) => ({
      ...p,
      hasPresentationPdf: await presentationPdfFileExists(
        (p as { presentationPdfPath?: string | null }).presentationPdfPath ??
          null
      ),
    }))
  );

  const sortedPresentations = sortPresentationsByPresenterName(withPdfFlags);

  let coursePayload: typeof course & {
    joinUrl?: string;
    professorName?: string;
  } = {
    ...course,
    professorName: leadProfessor?.name ?? undefined,
  };
  if (isLeadProfessor(session.user.role)) {
    const withAccess = await ensureCourseAccessToken(id);
    if (withAccess) {
      coursePayload = {
        ...coursePayload,
        accessToken: withAccess.accessToken,
        joinUrl: withAccess.joinUrl,
      };
    }
  }

  return NextResponse.json({
    course: coursePayload,
    presentations: sortedPresentations,
    viewerRole: session.user.role,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !isLeadProfessor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.course.findFirst({
    where: { id, professorId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: {
    name?: string;
    semester?: string;
    weightPeer?: number;
    weightObserver?: number;
    weightLead?: number;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "평가명을 입력해주세요." }, { status: 400 });
    }
    data.name = name;
  }

  if (body.semester !== undefined) {
    const semester = String(body.semester).trim();
    if (!semester) {
      return NextResponse.json({ error: "평가 일시를 입력해주세요." }, { status: 400 });
    }
    data.semester = semester;
  }

  if (
    body.weightPeer !== undefined ||
    body.weightObserver !== undefined ||
    body.weightLead !== undefined
  ) {
    const peer = Number(body.weightPeer ?? existing.weightPeer);
    const observer = Number(body.weightObserver ?? existing.weightObserver);
    const lead = Number(body.weightLead ?? existing.weightLead);
    const normalized = normalizeWeights(peer, observer, lead);
    if (!normalized) {
      return NextResponse.json(
        { error: "평가 비중 합계는 0보다 커야 합니다." },
        { status: 400 }
      );
    }
    data.weightPeer = normalized.peer;
    data.weightObserver = normalized.observer;
    data.weightLead = normalized.lead;
  }

  const updated = await prisma.course.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !isLeadProfessor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.course.findFirst({
    where: { id, professorId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
