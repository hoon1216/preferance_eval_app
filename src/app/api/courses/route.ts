import { auth } from "@/lib/auth";
import { ensureCourseAccessToken } from "@/lib/course-access";
import { listObserverCoursesForUser } from "@/lib/observer-courses";
import { canManageCourse, isLeadProfessor, isObserverProfessor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isLeadProfessor(session.user.role)) {
    const courses = await prisma.course.findMany({
      where: { professorId: session.user.id },
      include: {
        _count: { select: { enrollments: true, presentations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  }

  if (isObserverProfessor(session.user.role)) {
    const courses = await listObserverCoursesForUser(
      session.user.id,
      session.user.name
    );
    return NextResponse.json(courses);
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          professor: { select: { name: true } },
          _count: { select: { presentations: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(
    enrollments.map((e) => ({
      ...e.course,
      professorName: e.course.professor.name,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageCourse(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const semester = String(body.semester ?? "").trim();

  if (!name || !semester) {
    return NextResponse.json({ error: "강의명과 학기를 입력해주세요." }, { status: 400 });
  }

  const code = crypto.randomUUID().slice(0, 8).toUpperCase();

  const course = await prisma.course.create({
    data: {
      name,
      semester,
      code,
      professorId: session.user.id,
    },
  });

  await ensureCourseAccessToken(course.id);

  return NextResponse.json(course, { status: 201 });
}
