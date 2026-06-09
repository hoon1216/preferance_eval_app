import { auth } from "@/lib/auth";
import {
  parseCustomerAge,
  parseCustomerGender,
} from "@/lib/customer-demographics";
import { normalizeParticipantName } from "@/lib/participant-name";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; observerId: string }> };

export async function PATCH(request: Request, { params }: Params) {
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
    return NextResponse.json({ error: "등록된 고객이 아닙니다." }, { status: 404 });
  }

  const body = await request.json();
  const name = normalizeParticipantName(String(body.name ?? ""));
  const gender = parseCustomerGender(body.gender);
  const age = parseCustomerAge(body.age);

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!gender) {
    return NextResponse.json({ error: "성별을 선택해주세요." }, { status: 400 });
  }
  if (age === null) {
    return NextResponse.json(
      { error: "연령을 1~120 사이의 숫자로 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    await prisma.courseObserver.update({
      where: { id: observer.id },
      data: { name, gender, age },
    });
    if (observer.userId) {
      await prisma.user.update({
        where: { id: observer.userId },
        data: { name, gender },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "같은 이름의 고객이 이미 등록되어 있습니다." },
      { status: 400 }
    );
  }
}

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
    return NextResponse.json({ error: "등록된 고객이 아닙니다." }, { status: 404 });
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
