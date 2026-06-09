import { auth } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; sectionId: string }> };

async function getOwnedSection(courseId: string, sectionId: string, userId: string) {
  return prisma.surveySection.findFirst({
    where: { id: sectionId, courseId, course: { professorId: userId } },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, sectionId } = await params;
  const existing = await getOwnedSection(courseId, sectionId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: {
    title?: string;
    description?: string | null;
    orderIndex?: number;
  } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: "섹션 제목을 입력해주세요." }, { status: 400 });
    }
    data.title = title;
  }
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }
  if (body.orderIndex !== undefined) {
    data.orderIndex = Number(body.orderIndex);
  }

  const updated = await prisma.surveySection.update({
    where: { id: sectionId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, sectionId } = await params;
  const existing = await getOwnedSection(courseId, sectionId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.surveySection.delete({ where: { id: sectionId } });
  return NextResponse.json({ ok: true });
}
