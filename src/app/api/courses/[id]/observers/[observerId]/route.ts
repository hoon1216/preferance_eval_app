import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; observerId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, observerId } = await params;

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const observer = await prisma.courseObserver.findFirst({
    where: { id: observerId, courseId },
  });
  if (!observer) {
    return NextResponse.json({ error: "등록된 참관교수가 아닙니다." }, { status: 404 });
  }

  const linkedUserId = observer.userId;

  await prisma.courseObserver.delete({ where: { id: observer.id } });

  if (linkedUserId) {
    const otherSlots = await prisma.courseObserver.count({
      where: { userId: linkedUserId },
    });
    if (otherSlots === 0) {
      const user = await prisma.user.findUnique({
        where: { id: linkedUserId },
        select: { role: true },
      });
      if (user?.role === "OBSERVER_PROFESSOR") {
        await prisma.user.delete({ where: { id: linkedUserId } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
