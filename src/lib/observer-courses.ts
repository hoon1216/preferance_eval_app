import { normalizeParticipantName } from "@/lib/participant-name";
import { prisma } from "@/lib/prisma";

const courseInclude = {
  professor: { select: { name: true } },
  _count: { select: { enrollments: true, observers: true } },
} as const;

function nameMatchesSlot(slotName: string, userName: string) {
  return normalizeParticipantName(slotName) === normalizeParticipantName(userName);
}

/** 참관교수 계정에 연결된 평가 목록 (등록 이름 기준, userId 자동 연결) */
export async function listObserverCoursesForUser(userId: string, userName: string) {
  const allSlots = await prisma.courseObserver.findMany({
    include: { course: { include: courseInclude } },
  });

  const matches = allSlots.filter((slot) => nameMatchesSlot(slot.name, userName));

  for (const slot of matches) {
    if (slot.userId !== userId) {
      await prisma.courseObserver.update({
        where: { id: slot.id },
        data: { userId },
      });
    }
  }

  const seen = new Set<string>();
  return matches
    .filter((slot) => {
      if (seen.has(slot.courseId)) return false;
      seen.add(slot.courseId);
      return true;
    })
    .map((slot) => ({
      ...slot.course,
      professorName: slot.course.professor.name,
    }));
}

/** 특정 평가에 대한 참관교수 슬롯 (접근 권한·상세 조회용) */
export async function findObserverSlotForUser(courseId: string, userId: string) {
  const byUser = await prisma.courseObserver.findFirst({
    where: { courseId, userId },
  });
  if (byUser) return byUser;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });
  if (!user || user.role !== "OBSERVER_PROFESSOR") return null;

  const slots = await prisma.courseObserver.findMany({
    where: { courseId },
  });
  const match = slots.find((slot) => nameMatchesSlot(slot.name, user.name));
  if (!match) return null;

  if (match.userId !== userId) {
    return prisma.courseObserver.update({
      where: { id: match.id },
      data: { userId },
    });
  }

  return match;
}
