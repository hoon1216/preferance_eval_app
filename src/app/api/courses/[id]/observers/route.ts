import { auth } from "@/lib/auth";
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

  const name = normalizeParticipantName(String((await request.json()).name ?? ""));
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  try {
    const { randomUUID } = await import("crypto");
    const observer = await prisma.courseObserver.create({
      data: { courseId, name, accessToken: randomUUID() },
    });
    return NextResponse.json(observer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "같은 이름의 참관교수가 이미 등록되어 있습니다." },
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
    include: {
      user: { select: { email: true } },
    },
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
        email: o.user?.email ?? null,
        userId: o.userId,
      };
    })
  );

  return NextResponse.json(rows);
}
