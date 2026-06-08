import { buildJoinUrl } from "@/lib/access-link";
import { findCourseByAccessToken } from "@/lib/course-access";
import { lookupParticipantByName } from "@/lib/course-participants";
import { normalizeParticipantName } from "@/lib/participant-name";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ token: string }> };

const duplicateNameError =
  "같은 이름이 여러 명 등록되어 있습니다. 담당교수에게 문의해주세요.";

async function linkObserverToUser(
  observerId: string,
  userId: string,
  department: string
) {
  try {
    await prisma.courseObserver.update({
      where: { id: observerId },
      data: { userId, department },
    });
  } catch {
    await prisma.courseObserver.update({
      where: { id: observerId },
      data: { userId },
    });
    await prisma.$executeRaw`
      UPDATE CourseObserver SET department = ${department} WHERE id = ${observerId}
    `;
  }
}

async function completeStudentProfile(
  studentUserId: string,
  email: string,
  studentId: string,
  passwordHash: string
) {
  await prisma.user.update({
    where: { id: studentUserId },
    data: { email, studentId, passwordHash, profileComplete: true },
  });
}

async function completeObserverProfile(
  observerId: string,
  observerName: string,
  email: string,
  department: string,
  passwordHash: string
) {
  const user = await prisma.user.create({
    data: {
      name: observerName,
      email,
      passwordHash,
      role: "OBSERVER_PROFESSOR",
      profileComplete: true,
    },
  });

  await linkObserverToUser(observerId, user.id, department);

  const key = normalizeParticipantName(observerName);
  const orphanSlots = await prisma.courseObserver.findMany({
    where: { userId: null },
  });
  const sameNameSlots = orphanSlots.filter(
    (s) => normalizeParticipantName(s.name) === key
  );
  for (const slot of sameNameSlots) {
    await prisma.courseObserver.update({
      where: { id: slot.id },
      data: { userId: user.id },
    });
  }

  return user;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const nameParam = normalizeParticipantName(
      new URL(request.url).searchParams.get("name") ?? ""
    );

    const course = await findCourseByAccessToken(token);

    if (course) {
      if (!nameParam) {
        return NextResponse.json({
          type: "COURSE" as const,
          courseName: course.name,
          courseSemester: course.semester,
          joinUrl: buildJoinUrl(token),
        });
      }

    const participant = await lookupParticipantByName(course.id, nameParam);
    if (participant && "error" in participant) {
      return NextResponse.json({ error: duplicateNameError }, { status: 409 });
    }
    if (!participant) {
      return NextResponse.json(
        { error: "등록된 이름이 없습니다. 편집 화면에 등록한 이름과 동일하게 입력해주세요." },
        { status: 404 }
      );
    }

    const { studentUserId: _s, observerId: _o, ...publicParticipant } = participant as {
      studentUserId?: string;
      observerId?: string;
      type: string;
      name: string;
      courseName: string;
      courseSemester: string;
      profileComplete: boolean;
    };

    return NextResponse.json({
      ...publicParticipant,
      joinUrl: buildJoinUrl(token),
    });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { accessToken: token },
      include: {
        student: { select: { name: true, profileComplete: true } },
        course: { select: { name: true, semester: true } },
      },
    });
    if (enrollment) {
      return NextResponse.json({
        type: "STUDENT" as const,
        name: enrollment.student.name,
        courseName: enrollment.course.name,
        courseSemester: enrollment.course.semester,
        profileComplete: enrollment.student.profileComplete,
        joinUrl: buildJoinUrl(token),
      });
    }

    const observer = await prisma.courseObserver.findUnique({
      where: { accessToken: token },
      include: { course: { select: { name: true, semester: true } } },
    });
    if (observer) {
      return NextResponse.json({
        type: "OBSERVER" as const,
        name: observer.name,
        courseName: observer.course.name,
        courseSemester: observer.course.semester,
        profileComplete: !!observer.userId,
        joinUrl: buildJoinUrl(token),
      });
    }

    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  } catch (err) {
    console.error("GET /api/join/[token] failed:", err);
    return NextResponse.json(
      { error: "접속 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const studentId = String(body.studentId ?? "").trim();
    const registeredName = normalizeParticipantName(String(body.registeredName ?? ""));
    const department = String(body.department ?? "").trim();

    if (!email || password.length < 6) {
      return NextResponse.json(
        { error: "이메일과 비밀번호(6자 이상)를 입력해주세요." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const course = await findCourseByAccessToken(token);

    if (course) {
      if (!registeredName) {
        return NextResponse.json({ error: "이름을 확인해주세요." }, { status: 400 });
      }

      const participant = await lookupParticipantByName(course.id, registeredName);
      if (participant && "error" in participant) {
        return NextResponse.json({ error: duplicateNameError }, { status: 409 });
      }
      if (!participant) {
        return NextResponse.json(
          { error: "등록된 이름이 없습니다. 편집 화면에 등록한 이름과 동일하게 입력해주세요." },
          { status: 404 }
        );
      }

      if (participant.type === "STUDENT") {
        if (participant.profileComplete) {
          return NextResponse.json(
            { error: "이미 설정이 완료된 계정입니다." },
            { status: 400 }
          );
        }
        const studentUserId = participant.studentUserId;
        if (!studentUserId) {
          return NextResponse.json({ error: "등록된 이름이 없습니다." }, { status: 404 });
        }
        if (!studentId) {
          return NextResponse.json({ error: "학번을 입력해주세요." }, { status: 400 });
        }

        const emailTaken = await prisma.user.findUnique({ where: { email } });
        if (emailTaken && emailTaken.id !== studentUserId) {
          return NextResponse.json(
            { error: "이미 사용 중인 이메일입니다." },
            { status: 400 }
          );
        }

        const idTaken = await prisma.user.findUnique({ where: { studentId } });
        if (idTaken && idTaken.id !== studentUserId) {
          return NextResponse.json(
            { error: "이미 사용 중인 학번입니다." },
            { status: 400 }
          );
        }

        await completeStudentProfile(studentUserId, email, studentId, passwordHash);

        return NextResponse.json({
          ok: true,
          role: "STUDENT",
          name: participant.name,
        });
      }

      const observer = await prisma.courseObserver.findUnique({
        where: { id: participant.observerId },
      });
      if (!observer) {
        return NextResponse.json({ error: "등록된 이름이 없습니다." }, { status: 404 });
      }

      if (observer.userId) {
        return NextResponse.json(
          { error: "이미 설정이 완료된 계정입니다." },
          { status: 400 }
        );
      }
      if (!department) {
        return NextResponse.json({ error: "학과를 입력해주세요." }, { status: 400 });
      }

      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 400 }
        );
      }

      await completeObserverProfile(
        observer.id,
        observer.name,
        email,
        department,
        passwordHash
      );

      return NextResponse.json({
        ok: true,
        role: "OBSERVER_PROFESSOR",
        name: observer.name,
      });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { accessToken: token },
      include: { student: true },
    });

    if (enrollment) {
      if (enrollment.student.profileComplete) {
        return NextResponse.json(
          { error: "이미 설정이 완료된 계정입니다." },
          { status: 400 }
        );
      }
      if (!studentId) {
        return NextResponse.json({ error: "학번을 입력해주세요." }, { status: 400 });
      }

      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken && emailTaken.id !== enrollment.studentId) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 400 }
        );
      }

      const idTaken = await prisma.user.findUnique({ where: { studentId } });
      if (idTaken && idTaken.id !== enrollment.studentId) {
        return NextResponse.json(
          { error: "이미 사용 중인 학번입니다." },
          { status: 400 }
        );
      }

      await completeStudentProfile(
        enrollment.studentId,
        email,
        studentId,
        passwordHash
      );

      return NextResponse.json({
        ok: true,
        role: "STUDENT",
        name: enrollment.student.name,
      });
    }

    const observer = await prisma.courseObserver.findUnique({
      where: { accessToken: token },
    });
    if (!observer) {
      return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
    }

    if (observer.userId) {
      return NextResponse.json(
        { error: "이미 설정이 완료된 계정입니다." },
        { status: 400 }
      );
    }
    if (!department) {
      return NextResponse.json({ error: "학과를 입력해주세요." }, { status: 400 });
    }

    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    await completeObserverProfile(
      observer.id,
      observer.name,
      email,
      department,
      passwordHash
    );

    return NextResponse.json({
      ok: true,
      role: "OBSERVER_PROFESSOR",
      name: observer.name,
    });
  } catch (err) {
    console.error("POST /api/join/[token] failed:", err);
    return NextResponse.json(
      {
        error:
          "설정 처리 중 오류가 발생했습니다. 개발 서버를 재시작한 뒤 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
