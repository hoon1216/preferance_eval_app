import { findObserverSlotForUser } from "@/lib/observer-courses";
import { canManageCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function canAccessSurveyForm(
  courseId: string,
  userId: string,
  role: string
) {
  if (canManageCourse(role)) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, professorId: userId },
    });
    return !!course;
  }
  if (role === "OBSERVER_PROFESSOR") {
    const slot = await findObserverSlotForUser(courseId, userId);
    return !!slot;
  }
  return false;
}

export async function loadSurveyForm(courseId: string) {
  const sections = await prisma.surveySection.findMany({
    where: { courseId },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  return sections;
}
