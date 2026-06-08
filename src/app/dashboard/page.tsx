import { auth } from "@/lib/auth";
import { ensureCourseAccessToken } from "@/lib/course-access";
import {
  ProfessorEvaluationListCard,
  ReadonlyEvaluationListCard,
} from "@/components/evaluation-list-card";
import { listObserverCoursesForUser } from "@/lib/observer-courses";
import { canManageCourse } from "@/lib/permissions";
import { pillButtonPrimaryClass } from "@/lib/pill-button";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getCourses(userId: string, role: string) {
  const { prisma } = await import("@/lib/prisma");

  if (role === "PROFESSOR") {
    const courses = await prisma.course.findMany({
      where: { professorId: userId },
      include: {
        _count: { select: { enrollments: true, observers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(
      courses.map(async (course) => {
        const access = await ensureCourseAccessToken(course.id);
        return { ...course, joinUrl: access?.joinUrl ?? null };
      })
    );
  }

  if (role === "OBSERVER_PROFESSOR") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) return [];
    return listObserverCoursesForUser(userId, user.name);
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: userId },
    include: {
      course: {
        include: {
          professor: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return enrollments.map((e) => ({
    ...e.course,
    professorName: e.course.professor.name,
  }));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const courses = await getCourses(session.user.id, session.user.role);
  const isProfessor = canManageCourse(session.user.role);
  const isObserver = session.user.role === "OBSERVER_PROFESSOR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">
          {isProfessor || isObserver
            ? "평가 목록"
            : `${session.user.name} 평가 목록`}
        </h1>
        {isProfessor && (
          <Link
            href="/dashboard/courses/new"
            className={`shrink-0 ${pillButtonPrimaryClass}`}
          >
            평가 추가
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="mt-8 text-zinc-600">
          {isProfessor
            ? "아직 등록된 평가가 없습니다. 평가 추가로 새 평가를 만들어주세요."
            : isObserver
              ? "등록된 평가가 없습니다. 담당 교수가 참관교수로 등록해 주시면 표시됩니다."
              : "등록된 평가가 없습니다. 교수님이 수강 등록해 주시면 표시됩니다."}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {courses.map((course) => {
            if (isProfessor) {
              const joinUrl =
                "joinUrl" in course && typeof course.joinUrl === "string"
                  ? course.joinUrl
                  : null;
              const counts = course._count as {
                enrollments: number;
                observers: number;
              };

              return (
                <ProfessorEvaluationListCard
                  key={course.id}
                  courseId={course.id}
                  name={course.name}
                  semester={course.semester}
                  studentCount={counts.enrollments}
                  observerCount={counts.observers}
                  joinUrl={joinUrl}
                />
              );
            }

            const studentCount =
              "_count" in course &&
              course._count &&
              "enrollments" in course._count
                ? course._count.enrollments
                : undefined;

            const subtitle =
              "professorName" in course && course.professorName
                ? `담당교수 ${course.professorName}`
                : undefined;

            const observerCount =
              "_count" in course &&
              course._count &&
              "observers" in course._count
                ? course._count.observers
                : undefined;

            return (
              <ReadonlyEvaluationListCard
                key={course.id}
                courseId={course.id}
                name={course.name}
                semester={course.semester}
                studentCount={studentCount}
                observerCount={observerCount}
                subtitle={subtitle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
