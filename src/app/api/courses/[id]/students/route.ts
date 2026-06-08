import { auth } from "@/lib/auth";
import { canManageCourse, isLeadProfessor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { courseHasStudentWithName } from "@/lib/course-participants";
import { ensureStudentEnrollment } from "@/lib/course-enrollment";
import { hashInitialPassword } from "@/lib/default-password";
import { normalizeParticipantName } from "@/lib/participant-name";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
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

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    if (await courseHasStudentWithName(courseId, name)) {
      return NextResponse.json(
        { error: "같은 이름의 학생이 이미 등록되어 있습니다." },
        { status: 400 }
      );
    }

    const passwordHash = await hashInitialPassword();

    const student = await prisma.user.create({
      data: {
        name,
        role: "STUDENT",
        passwordHash,
        profileComplete: false,
      },
    });

    await ensureStudentEnrollment(courseId, student.id);

    const existingPresentation = await prisma.presentation.findUnique({
      where: {
        courseId_presenterId: { courseId, presenterId: student.id },
      },
    });
    if (!existingPresentation) {
      const count = await prisma.presentation.count({ where: { courseId } });
      await prisma.presentation.create({
        data: {
          courseId,
          presenterId: student.id,
          orderIndex: count,
        },
      });
    }

    const presentation = await prisma.presentation.findFirst({
      where: { courseId, presenterId: student.id },
      select: { title: true },
    });

    return NextResponse.json(
      {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        taskTitle: presentation?.title ?? null,
        profileComplete: student.profileComplete,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /students failed:", err);
    return NextResponse.json(
      {
        error:
          "학생 등록 중 서버 오류가 발생했습니다. 개발 서버를 재시작한 뒤 `npm run db:push`를 실행해 주세요.",
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    return await getStudents(_request, { params });
  } catch (err) {
    console.error("GET /students failed:", err);
    return NextResponse.json(
      {
        error:
          "학생 목록을 불러오지 못했습니다. `npm run db:push` 후 개발 서버를 재시작해 주세요.",
      },
      { status: 500 }
    );
  }
}

async function getStudents(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const allowed =
    isLeadProfessor(session.user.role)
      ? await prisma.course.findFirst({
          where: { id: courseId, professorId: session.user.id },
        })
      : await prisma.courseEnrollment.findFirst({
          where: { courseId, studentId: session.user.id },
        });

  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [enrollments, presentations] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
            profileComplete: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.presentation.findMany({
      where: { courseId },
      select: {
        presenterId: true,
        title: true,
        presenter: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
            profileComplete: true,
            role: true,
          },
        },
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const taskTitleByStudent = new Map<string, string | null>();
  for (const p of presentations) {
    if (!taskTitleByStudent.has(p.presenterId)) {
      taskTitleByStudent.set(p.presenterId, p.title);
    }
  }

  const studentMap = new Map<
    string,
    {
      id: string;
      name: string;
      studentId: string | null;
      email: string | null;
      profileComplete: boolean;
      enrollmentId?: string;
      accessToken?: string | null;
    }
  >();

  for (const e of enrollments) {
    if (e.student.role !== "STUDENT") continue;
    studentMap.set(e.student.id, {
      id: e.student.id,
      name: e.student.name,
      studentId: e.student.studentId,
      email: e.student.email,
      profileComplete: e.student.profileComplete,
      enrollmentId: e.id,
      accessToken: e.accessToken,
    });
  }

  for (const p of presentations) {
    if (p.presenter.role !== "STUDENT") continue;
    if (!studentMap.has(p.presenter.id)) {
      studentMap.set(p.presenter.id, {
        id: p.presenter.id,
        name: p.presenter.name,
        studentId: p.presenter.studentId,
        email: p.presenter.email,
        profileComplete: p.presenter.profileComplete,
      });
    }
  }

  const rows = await Promise.all(
    Array.from(studentMap.values())
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      .map(async (student) => {
        const enrollment = await ensureStudentEnrollment(courseId, student.id);
        return {
          id: student.id,
          enrollmentId: student.enrollmentId ?? enrollment.id,
          name: student.name,
          studentId: student.studentId,
          email: student.email,
          taskTitle: taskTitleByStudent.get(student.id) ?? null,
          profileComplete: student.profileComplete,
        };
      })
  );

  return NextResponse.json(rows);
}
