import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { surveyQuestionFilter } from "@/lib/survey-questions";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; questionId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, questionId } = await params;
  const existing = await prisma.presentation.findFirst({
    where: { id: questionId, courseId, ...surveyQuestionFilter },
    include: { course: true },
  });

  if (!existing || existing.course.professorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = String(body.title ?? existing.title ?? "").trim();
  const overview = String(body.overview ?? existing.overview ?? "").trim();

  if (!title || !overview) {
    return NextResponse.json(
      { error: "질문 제목과 내용을 모두 입력해주세요." },
      { status: 400 }
    );
  }

  const updated = await prisma.presentation.update({
    where: { id: questionId },
    data: { title, overview, status: "READY" },
    select: { id: true, title: true, overview: true, orderIndex: true, status: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, questionId } = await params;
  const existing = await prisma.presentation.findFirst({
    where: { id: questionId, courseId, ...surveyQuestionFilter },
    include: { course: true },
  });

  if (!existing || existing.course.professorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.presentation.delete({ where: { id: questionId } });
  return NextResponse.json({ ok: true });
}
