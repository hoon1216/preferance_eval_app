import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { surveyQuestionFilter } from "@/lib/survey-questions";
import { sortPresentationsByOrderIndex } from "@/lib/sort-presentations";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const allowed = await prisma.course.findFirst({
    where:
      session.user.role === "PROFESSOR"
        ? { id: courseId, professorId: session.user.id }
        : { id: courseId },
  });

  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = await prisma.presentation.findMany({
    where: { courseId, ...surveyQuestionFilter },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      overview: true,
      orderIndex: true,
      status: true,
      presentationPdfPath: true,
    },
  });

  return NextResponse.json(sortPresentationsByOrderIndex(questions));
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const overview = String(body.overview ?? "").trim();

  if (!title || !overview) {
    return NextResponse.json(
      { error: "질문 제목과 내용을 모두 입력해주세요." },
      { status: 400 }
    );
  }

  const count = await prisma.presentation.count({
    where: { courseId, ...surveyQuestionFilter },
  });

  const question = await prisma.presentation.create({
    data: {
      courseId,
      presenterId: null,
      title,
      overview,
      orderIndex: count,
      status: "READY",
    },
    select: {
      id: true,
      title: true,
      overview: true,
      orderIndex: true,
      status: true,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
