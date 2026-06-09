import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

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
  const title = String(body.title ?? "새 섹션").trim() || "새 섹션";
  const description = body.description
    ? String(body.description).trim()
    : null;

  const count = await prisma.surveySection.count({ where: { courseId } });

  const section = await prisma.surveySection.create({
    data: {
      courseId,
      title,
      description,
      orderIndex: count,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
