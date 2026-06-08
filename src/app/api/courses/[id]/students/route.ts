import { auth } from "@/lib/auth";
import { courseHasStudentWithName } from "@/lib/course-participants";
import { ensureStudentEnrollment } from "@/lib/course-enrollment";
import {
  customerProfileSelect,
  parseCustomerProfile,
} from "@/lib/customer-profile";
import { hashInitialPassword } from "@/lib/default-password";
import { canManageCourse } from "@/lib/permissions";
import { normalizeParticipantName } from "@/lib/participant-name";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const profile = parseCustomerProfile(body);

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    if (!profile.ok) {
      return NextResponse.json({ error: profile.error }, { status: 400 });
    }

    if (await courseHasStudentWithName(courseId, name)) {
      return NextResponse.json(
        { error: "같은 이름의 고객이 이미 등록되어 있습니다." },
        { status: 400 }
      );
    }

    const passwordHash = await hashInitialPassword();

    const student = await prisma.user.create({
      data: {
        name,
        role: "STUDENT",
        passwordHash,
        profileComplete: true,
        email: null,
        studentId: null,
        ...profile.data,
      },
      select: {
        id: true,
        name: true,
        profileComplete: true,
        ...customerProfileSelect,
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
        ...student,
        taskTitle: presentation?.title ?? null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /students failed:", err);
    return NextResponse.json(
      {
        error:
          "고객 등록 중 서버 오류가 발생했습니다. 개발 서버를 재시작한 뒤 `npm run db:push`를 실행해 주세요.",
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
          "고객 목록을 불러오지 못했습니다. `npm run db:push` 후 개발 서버를 재시작해 주세요.",
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
    session.user.role === "PROFESSOR"
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
            profileComplete: true,
            role: true,
            ...customerProfileSelect,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.presentation.findMany({
      where: { courseId },
      select: {
        id: true,
        presenterId: true,
        title: true,
        presenter: {
          select: {
            id: true,
            name: true,
            profileComplete: true,
            role: true,
            ...customerProfileSelect,
          },
        },
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const taskTitleByStudent = new Map<string, string | null>();
  const presentationIdByStudent = new Map<string, string>();
  for (const p of presentations) {
    if (!taskTitleByStudent.has(p.presenterId)) {
      taskTitleByStudent.set(p.presenterId, p.title);
      presentationIdByStudent.set(p.presenterId, p.id);
    }
  }

  type StudentRow = {
    id: string;
    name: string;
    profileComplete: boolean;
    enrollmentId?: string;
    accessToken?: string | null;
    presentationId?: string | null;
    taskTitle: string | null;
    birthDate: string | null;
    gender: string | null;
    occupation: string | null;
    residenceRegion: string | null;
    familyCount: number | null;
    notes: string | null;
  };

  const studentMap = new Map<string, StudentRow>();

  for (const e of enrollments) {
    if (e.student.role !== "STUDENT") continue;
    studentMap.set(e.student.id, {
      id: e.student.id,
      name: e.student.name,
      profileComplete: e.student.profileComplete,
      enrollmentId: e.id,
      accessToken: e.accessToken,
      presentationId: presentationIdByStudent.get(e.student.id) ?? null,
      taskTitle: taskTitleByStudent.get(e.student.id) ?? null,
      birthDate: e.student.birthDate,
      gender: e.student.gender,
      occupation: e.student.occupation,
      residenceRegion: e.student.residenceRegion,
      familyCount: e.student.familyCount,
      notes: e.student.notes,
    });
  }

  for (const p of presentations) {
    if (p.presenter.role !== "STUDENT") continue;
    if (!studentMap.has(p.presenter.id)) {
      studentMap.set(p.presenter.id, {
        id: p.presenter.id,
        name: p.presenter.name,
        profileComplete: p.presenter.profileComplete,
        presentationId: p.id,
        taskTitle: p.title,
        birthDate: p.presenter.birthDate,
        gender: p.presenter.gender,
        occupation: p.presenter.occupation,
        residenceRegion: p.presenter.residenceRegion,
        familyCount: p.presenter.familyCount,
        notes: p.presenter.notes,
      });
    }
  }

  const rows = await Promise.all(
    Array.from(studentMap.values())
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      .map(async (student) => {
        const enrollment = await ensureStudentEnrollment(courseId, student.id);
        return {
          ...student,
          enrollmentId: student.enrollmentId ?? enrollment.id,
          presentationId:
            student.presentationId ??
            presentationIdByStudent.get(student.id) ??
            null,
          taskTitle: student.taskTitle ?? taskTitleByStudent.get(student.id) ?? null,
        };
      })
  );

  return NextResponse.json(rows);
}
