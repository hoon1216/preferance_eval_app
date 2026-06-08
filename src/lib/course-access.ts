import { buildJoinUrl } from "@/lib/access-link";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function findCourseByAccessToken(token: string) {
  try {
    return await prisma.course.findFirst({
      where: { accessToken: token },
      select: { id: true, name: true, semester: true },
    });
  } catch (err) {
    console.error("findCourseByAccessToken failed:", err);
    return null;
  }
}

export async function ensureCourseAccessToken(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, accessToken: true },
    });
    if (!course) return null;

    let token = course.accessToken;
    if (!token) {
      token = randomUUID();
      await prisma.course.update({
        where: { id: courseId },
        data: { accessToken: token },
      });
    }

    return { accessToken: token, joinUrl: buildJoinUrl(token) };
  } catch (err) {
    console.error("ensureCourseAccessToken failed:", err);
    return null;
  }
}
