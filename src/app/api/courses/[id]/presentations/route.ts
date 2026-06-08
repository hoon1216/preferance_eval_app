import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sortPresentationsByPresenterName } from "@/lib/sort-presentations";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSOR") {
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
  const presenterId = String(body.presenterId ?? "");
  const presentationDate = body.presentationDate
    ? new Date(body.presentationDate)
    : null;

  if (!presenterId) {
    return NextResponse.json({ error: "발표 학생을 선택해주세요." }, { status: 400 });
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { courseId, studentId: presenterId },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "수강 등록된 학생만 발표자로 지정할 수 있습니다." }, { status: 400 });
  }

  const count = await prisma.presentation.count({ where: { courseId } });

  const presentation = await prisma.presentation.create({
    data: {
      courseId,
      presenterId,
      presentationDate,
      orderIndex: count,
    },
    include: {
      presenter: { select: { id: true, name: true, studentId: true } },
    },
  });

  return NextResponse.json(presentation, { status: 201 });
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;

  const course =
    session.user.role === "PROFESSOR"
      ? await prisma.course.findFirst({
          where: { id: courseId, professorId: session.user.id },
        })
      : (
          await prisma.courseEnrollment.findFirst({
            where: { courseId, studentId: session.user.id },
            include: { course: true },
          })
        )?.course;

  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const presentations = await prisma.presentation.findMany({
    where: { courseId },
    include: {
      presenter: { select: { id: true, name: true, studentId: true } },
    },
  });

  return NextResponse.json(sortPresentationsByPresenterName(presentations));
}
