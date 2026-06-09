import { auth } from "@/lib/auth";
import { findObserverSlotForUser } from "@/lib/observer-courses";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { SurveyItemType } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

type ResponseInput = { itemId: string; value: unknown };

function validateValue(type: SurveyItemType, value: unknown): object | null {
  if (!value || typeof value !== "object") return null;
  switch (type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      if ("text" in value && typeof (value as { text: unknown }).text === "string") {
        return { text: (value as { text: string }).text };
      }
      return null;
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      if (
        "selected" in value &&
        typeof (value as { selected: unknown }).selected === "string"
      ) {
        return { selected: (value as { selected: string }).selected };
      }
      return null;
    case "MULTIPLE_CHOICE":
      if (
        "selected" in value &&
        Array.isArray((value as { selected: unknown }).selected)
      ) {
        return {
          selected: (value as { selected: string[] }).selected.map(String),
        };
      }
      return null;
    case "LINEAR_SCALE":
      if ("scale" in value && typeof (value as { scale: unknown }).scale === "number") {
        return { scale: (value as { scale: number }).scale };
      }
      return null;
    default:
      return null;
  }
}

function isEmptyValue(type: SurveyItemType, value: object): boolean {
  if (type === "SHORT_TEXT" || type === "LONG_TEXT") {
    return !("text" in value) || !String(value.text).trim();
  }
  if (type === "SINGLE_CHOICE" || type === "DROPDOWN") {
    return !("selected" in value) || !String(value.selected).trim();
  }
  if (type === "MULTIPLE_CHOICE") {
    return (
      !("selected" in value) ||
      !Array.isArray(value.selected) ||
      value.selected.length === 0
    );
  }
  if (type === "LINEAR_SCALE") {
    return !("scale" in value) || typeof value.scale !== "number";
  }
  return true;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;

  if (session.user.role === "OBSERVER_PROFESSOR") {
    const slot = await findObserverSlotForUser(courseId, session.user.id);
    if (!slot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = await prisma.surveyItem.findMany({
      where: { section: { courseId } },
      select: { id: true },
    });
    const itemIds = items.map((i) => i.id);

    const responses = await prisma.surveyItemResponse.findMany({
      where: {
        respondentId: session.user.id,
        itemId: { in: itemIds },
      },
      select: { itemId: true, value: true },
    });

    return NextResponse.json({
      responses: responses.map((r) => ({
        itemId: r.itemId,
        value: r.value,
      })),
      submitted: responses.length > 0,
    });
  }

  if (!canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const responses = await prisma.surveyItemResponse.findMany({
    where: { item: { section: { courseId } } },
    include: {
      respondent: { select: { id: true, name: true } },
      item: { select: { id: true, title: true, type: true, sectionId: true } },
    },
  });

  return NextResponse.json({ responses });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OBSERVER_PROFESSOR") {
    return NextResponse.json({ error: "고객만 응답할 수 있습니다." }, { status: 403 });
  }

  const { id: courseId } = await params;
  const slot = await findObserverSlotForUser(courseId, session.user.id);
  if (!slot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const inputs = Array.isArray(body.responses) ? body.responses : [];
  const parsed: ResponseInput[] = inputs.filter(
    (r: ResponseInput) => r?.itemId && r?.value
  );

  const items = await prisma.surveyItem.findMany({
    where: { section: { courseId } },
  });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  for (const input of parsed) {
    const item = itemMap.get(input.itemId);
    if (!item) continue;

    const value = validateValue(item.type, input.value);
    if (!value) {
      return NextResponse.json(
        { error: `${item.title} 문항의 응답 형식이 올바르지 않습니다.` },
        { status: 400 }
      );
    }
    if (item.required && isEmptyValue(item.type, value)) {
      return NextResponse.json(
        { error: `필수 문항「${item.title}」에 응답해주세요.` },
        { status: 400 }
      );
    }
  }

  for (const item of items) {
    if (!item.required) continue;
    const input = parsed.find((r) => r.itemId === item.id);
    if (!input) {
      return NextResponse.json(
        { error: `필수 문항「${item.title}」에 응답해주세요.` },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(
    parsed.map((input) => {
      const item = itemMap.get(input.itemId)!;
      const value = validateValue(item.type, input.value)!;
      return prisma.surveyItemResponse.upsert({
        where: {
          itemId_respondentId: {
            itemId: input.itemId,
            respondentId: session.user.id,
          },
        },
        create: {
          itemId: input.itemId,
          respondentId: session.user.id,
          value,
        },
        update: { value },
      });
    })
  );

  return NextResponse.json({ ok: true });
}
