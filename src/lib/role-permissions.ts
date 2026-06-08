/** Prisma/DB 없이 사용 — middleware·클라이언트 안전 */

export type Role = "PROFESSOR" | "STUDENT" | "OBSERVER_PROFESSOR";

export const ROLE_LABELS: Record<Role, string> = {
  PROFESSOR: "담당교수",
  OBSERVER_PROFESSOR: "참관교수",
  STUDENT: "학생",
};

export type LoginRoleKey = "PROFESSOR" | "STUDENT" | "OBSERVER";

export function loginRoleToDbRole(loginRole: string): Role | null {
  switch (loginRole) {
    case "PROFESSOR":
      return "PROFESSOR";
    case "STUDENT":
      return "STUDENT";
    case "OBSERVER":
      return "OBSERVER_PROFESSOR";
    default:
      return null;
  }
}

export function isLeadProfessor(role: string): role is "PROFESSOR" {
  return role === "PROFESSOR";
}

export function isObserverProfessor(role: string): role is "OBSERVER_PROFESSOR" {
  return role === "OBSERVER_PROFESSOR";
}

export function isStudent(role: string): role is "STUDENT" {
  return role === "STUDENT";
}

export function canManageCourse(role: string) {
  return isLeadProfessor(role);
}

export function canViewCourseResults(role: string) {
  return isLeadProfessor(role) || isObserverProfessor(role);
}

export function canPeerEvaluate(role: string) {
  return isStudent(role);
}

export function canObserverEvaluate(role: string) {
  return isObserverProfessor(role);
}

export function canLeadProfessorEvaluate(
  role: string,
  courseProfessorId: string,
  userId: string
) {
  return isLeadProfessor(role) && courseProfessorId === userId;
}

export function canManageOwnAssignment(role: string) {
  return isStudent(role);
}
