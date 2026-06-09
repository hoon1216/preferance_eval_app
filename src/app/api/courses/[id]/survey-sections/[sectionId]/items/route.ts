import { auth } from "@/lib/auth";
import {
  defaultOptionsForType,
  defaultTitleForType,
} from "@/lib/survey-item-types";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { SurveyItemType } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; sectionId: string }> };

const VALID_TYPES: SurveyItemType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "LINEAR_SCALE",
];

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId, sectionId } = await params;
  const section = await prisma.surveySection.findFirst({
    where: {
      id: sectionId,
      courseId,
      course: { professorId: session.user.id },
    },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const type = String(body.type ?? "SHORT_TEXT") as SurveyItemType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "지원하지 않는 문항 유형입니다." }, { status: 400 });
  }

  const count = await prisma.surveyItem.count({ where: { sectionId } });

  const item = await prisma.surveyItem.create({
    data: {
      sectionId,
      type,
      title: defaultTitleForType(type),
      required: false,
      orderIndex: count,
      options: defaultOptionsForType(type),
    },
  });

  return NextResponse.json(item, { status: 201 });
}
