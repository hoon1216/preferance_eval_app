import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function ensureStudentEnrollment(courseId: string, studentUserId: string) {
  const existing = await prisma.courseEnrollment.findFirst({
    where: { courseId, studentId: studentUserId },
  });
  if (existing) {
    const token = existing.accessToken ?? randomUUID();
    if (!existing.accessToken) {
      await prisma.courseEnrollment.update({
        where: { id: existing.id },
        data: { accessToken: token },
      });
    }
    return existing;
  }

  return prisma.courseEnrollment.create({
    data: {
      courseId,
      studentId: studentUserId,
      accessToken: randomUUID(),
    },
  });
}
