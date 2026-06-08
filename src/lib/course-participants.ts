import { ensureStudentEnrollment } from "@/lib/course-enrollment";
import { normalizeParticipantName } from "@/lib/participant-name";
import { prisma } from "@/lib/prisma";

type CourseMeta = { name: string; semester: string };

export async function courseHasStudentWithName(courseId: string, rawName: string) {
  const key = normalizeParticipantName(rawName);
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    include: { student: { select: { name: true, role: true } } },
  });
  if (
    enrollments.some(
      (e) =>
        e.student.role === "STUDENT" &&
        normalizeParticipantName(e.student.name) === key
    )
  ) {
    return true;
  }

  const presentations = await prisma.presentation.findMany({
    where: { courseId },
    include: { presenter: { select: { name: true, role: true } } },
  });
  return presentations.some(
    (p) =>
      p.presenter.role === "STUDENT" &&
      normalizeParticipantName(p.presenter.name) === key
  );
}

/** 공통 접속 링크 이름 확인 — 수강 등록·발표자 모두 포함 */
export async function findStudentParticipantByName(courseId: string, rawName: string) {
  const key = normalizeParticipantName(rawName);
  if (!key) return null;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { name: true, semester: true },
  });
  if (!course) return null;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    include: {
      student: { select: { id: true, name: true, profileComplete: true, role: true } },
    },
  });

  const enrolledMatches = enrollments.filter(
    (e) =>
      e.student.role === "STUDENT" &&
      normalizeParticipantName(e.student.name) === key
  );

  if (enrolledMatches.length > 1) {
    return { error: "DUPLICATE" as const };
  }

  if (enrolledMatches.length === 1) {
    const student = enrolledMatches[0].student;
    return {
      type: "STUDENT" as const,
      name: student.name,
      courseName: course.name,
      courseSemester: course.semester,
      profileComplete: student.profileComplete,
      studentUserId: student.id,
    };
  }

  const presentations = await prisma.presentation.findMany({
    where: { courseId },
    include: {
      presenter: { select: { id: true, name: true, profileComplete: true, role: true } },
    },
  });

  const presenterMatches = presentations.filter(
    (p) =>
      p.presenter.role === "STUDENT" &&
      normalizeParticipantName(p.presenter.name) === key
  );

  if (presenterMatches.length > 1) {
    return { error: "DUPLICATE" as const };
  }

  if (presenterMatches.length === 1) {
    const presenter = presenterMatches[0].presenter;
    await ensureStudentEnrollment(courseId, presenter.id);
    return {
      type: "STUDENT" as const,
      name: presenter.name,
      courseName: course.name,
      courseSemester: course.semester,
      profileComplete: presenter.profileComplete,
      studentUserId: presenter.id,
    };
  }

  return null;
}

export async function findObserverParticipantByName(courseId: string, rawName: string) {
  const key = normalizeParticipantName(rawName);
  if (!key) return null;

  const observers = await prisma.courseObserver.findMany({
    where: { courseId },
    include: { course: { select: { name: true, semester: true } } },
  });

  const matches = observers.filter(
    (o) => normalizeParticipantName(o.name) === key
  );
  if (matches.length > 1) return { error: "DUPLICATE" as const };
  if (matches.length === 0) return null;

  const observer = matches[0];
  return {
    type: "OBSERVER" as const,
    name: observer.name,
    courseName: observer.course.name,
    courseSemester: observer.course.semester,
    profileComplete: !!observer.userId,
    observerId: observer.id,
  };
}

export async function lookupParticipantByName(courseId: string, rawName: string) {
  const student = await findStudentParticipantByName(courseId, rawName);
  if (student && "error" in student) {
    return student;
  }
  if (student) return student;

  const observer = await findObserverParticipantByName(courseId, rawName);
  if (observer && "error" in observer) {
    return observer;
  }
  if (observer) return observer;

  return null;
}

export async function resolveStudentEnrollment(
  courseId: string,
  participantName: string
) {
  const found = await findStudentParticipantByName(courseId, participantName);
  if (!found || "error" in found) return found ?? null;

  return prisma.courseEnrollment.findFirst({
    where: { courseId, studentId: found.studentUserId },
    include: { student: true },
  });
}
