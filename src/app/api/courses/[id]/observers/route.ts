import { auth } from "@/lib/auth";
import {
  parseCustomerAge,
  parseCustomerGender,
} from "@/lib/customer-demographics";
import { hashInitialPassword } from "@/lib/default-password";
import { normalizeParticipantName } from "@/lib/participant-name";
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
    const { randomUUID } = await import("crypto");
    const passwordHash = await hashInitialPassword();
    const user = await prisma.user.create({
      data: {
        name,
        role: "OBSERVER_PROFESSOR",
        passwordHash,
        profileComplete: true,
        gender,
      },
    });
    const observer = await prisma.courseObserver.create({
      data: {
        courseId,
        name,
        gender,
        age,
        userId: user.id,
        accessToken: randomUUID(),
      },
    });
    return NextResponse.json(observer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "같은 이름의 고객이 이미 등록되어 있습니다." },
      { status: 400 }
    );
  }
}

export async function GET(_request: Request, { params }: Params) {
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

  const observers = await prisma.courseObserver.findMany({
    where: { courseId },
    orderBy: { name: "asc" },
  });

  const { randomUUID } = await import("crypto");
  const rows = await Promise.all(
    observers.map(async (o) => {
      let token = o.accessToken;
      if (!token) {
        token = randomUUID();
        await prisma.courseObserver.update({
          where: { id: o.id },
          data: { accessToken: token },
        });
      }
      return {
        id: o.id,
        name: o.name,
        department: o.department,
        gender: o.gender,
        age: o.age,
        userId: o.userId,
      };
    })
  );

  return NextResponse.json(rows);
}
