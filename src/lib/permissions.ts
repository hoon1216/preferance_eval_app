import { findObserverSlotForUser } from "@/lib/observer-courses";
import { prisma } from "@/lib/prisma";

export type { LoginRoleKey, Role } from "@/lib/role-permissions";
export {
  ROLE_LABELS,
  canLeadProfessorEvaluate,
  canManageCourse,
  canManageOwnAssignment,
  canObserverEvaluate,
  canPeerEvaluate,
  canViewCourseResults,
  isLeadProfessor,
  isObserverProfessor,
  isStudent,
  loginRoleToDbRole,
} from "@/lib/role-permissions";

export async function userCanAccessCourse(
  courseId: string,
  userId: string,
  role: string
) {
  if (role === "PROFESSOR") {
    const course = await prisma.course.findFirst({
      where: { id: courseId, professorId: userId },
    });
    return !!course;
  }

  if (role === "OBSERVER_PROFESSOR") {
    const slot = await findObserverSlotForUser(courseId, userId);
    return !!slot;
  }

  if (role === "STUDENT") {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId, studentId: userId },
    });
    return !!enrollment;
  }

  return false;
}

export async function getCourseForUser(
  courseId: string,
  userId: string,
  role: string
) {
  if (role === "PROFESSOR") {
    return prisma.course.findFirst({
      where: { id: courseId, professorId: userId },
    });
  }
  if (role === "OBSERVER_PROFESSOR") {
    const slot = await findObserverSlotForUser(courseId, userId);
    if (!slot) return null;
    return prisma.course.findUnique({ where: { id: courseId } });
  }
  if (role === "STUDENT") {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId, studentId: userId },
      include: { course: true },
    });
    return enrollment?.course ?? null;
  }
  return null;
}

export async function canAccessPresentation(
  presentation: { courseId: string; presenterId: string; course: { professorId: string } },
  userId: string,
  role: string
) {
  if (role === "PROFESSOR" && presentation.course.professorId === userId) {
    return true;
  }
  if (role === "STUDENT") {
    const enrolled = await prisma.courseEnrollment.findFirst({
      where: { courseId: presentation.courseId, studentId: userId },
    });
    return !!enrolled;
  }
  if (role === "OBSERVER_PROFESSOR") {
    return userCanAccessCourse(presentation.courseId, userId, role);
  }
  return false;
}
