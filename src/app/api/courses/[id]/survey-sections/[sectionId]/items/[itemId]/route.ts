import { auth } from "@/lib/auth";
import { parseSurveyItemOptions } from "@/lib/survey-item-types";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string; sectionId: string; itemId: string }>;
};

async function getOwnedItem(
  courseId: string,
  sectionId: string,
  itemId: string,
  userId: string
) {
  return prisma.surveyItem.findFirst({
    where: {
      id: itemId,
      sectionId,
      section: { courseId, course: { professorId: userId } },
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, sectionId, itemId } = await params;
  const existing = await getOwnedItem(courseId, sectionId, itemId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: {
    title?: string;
    description?: string | null;
    required?: boolean;
    orderIndex?: number;
    options?: object;
  } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: "문항 제목을 입력해주세요." }, { status: 400 });
    }
    data.title = title;
  }
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }
  if (body.required !== undefined) {
    data.required = Boolean(body.required);
  }
  if (body.orderIndex !== undefined) {
    data.orderIndex = Number(body.orderIndex);
  }
  if (body.options !== undefined) {
    data.options = parseSurveyItemOptions(body.options);
  }

  const updated = await prisma.surveyItem.update({
    where: { id: itemId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, sectionId, itemId } = await params;
  const existing = await getOwnedItem(courseId, sectionId, itemId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.surveyItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
