import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; studentId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, studentId } = await params;

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { courseId, studentId },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "등록된 학생이 아닙니다." }, { status: 404 });
  }

  const presentation = await prisma.presentation.findUnique({
    where: { courseId_presenterId: { courseId, presenterId: studentId } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    if (presentation) {
      await tx.evaluation.deleteMany({
        where: { presentationId: presentation.id },
      });
      await tx.presentation.delete({ where: { id: presentation.id } });
    }

    await tx.evaluation.deleteMany({
      where: {
        evaluatorId: studentId,
        presentation: { courseId },
      },
    });

    await tx.courseEnrollment.delete({ where: { id: enrollment.id } });

    const otherEnrollments = await tx.courseEnrollment.count({
      where: { studentId },
    });
    const otherPresentations = await tx.presentation.count({
      where: { presenterId: studentId },
    });
    const otherEvaluations = await tx.evaluation.count({
      where: { evaluatorId: studentId },
    });

    if (
      otherEnrollments === 0 &&
      otherPresentations === 0 &&
      otherEvaluations === 0
    ) {
      const user = await tx.user.findUnique({
        where: { id: studentId },
        select: { role: true },
      });
      if (user?.role === "STUDENT") {
        await tx.user.delete({ where: { id: studentId } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
