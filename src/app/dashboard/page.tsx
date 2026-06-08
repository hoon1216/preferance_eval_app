import { auth } from "@/lib/auth";
import { ensureCourseAccessToken } from "@/lib/course-access";
import {
  ProfessorEvaluationListCard,
  ReadonlyEvaluationListCard,
} from "@/components/evaluation-list-card";
import { listObserverCoursesForUser } from "@/lib/observer-courses";
import { canManageCourse } from "@/lib/permissions";
import { pillButtonPrimaryClass } from "@/lib/pill-button";
import { surveyQuestionFilter } from "@/lib/survey-questions";
import { ADD_SURVEY_LABEL, SURVEY_LIST_LABEL } from "@/lib/ui-labels";
import Link from "next/link";
import { redirect } from "next/navigation";

async function countQuestions(courseId: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.presentation.count({
    where: { courseId, ...surveyQuestionFilter },
  });
}

async function getCourses(userId: string, role: string) {
  const { prisma } = await import("@/lib/prisma");

  if (role === "PROFESSOR") {
    const courses = await prisma.course.findMany({
      where: { professorId: userId },
      include: {
        _count: { select: { observers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(
      courses.map(async (course) => {
        const [access, questionCount] = await Promise.all([
          ensureCourseAccessToken(course.id),
          countQuestions(course.id),
        ]);
        return {
          ...course,
          joinUrl: access?.joinUrl ?? null,
          questionCount,
          customerCount: course._count.observers,
        };
      })
    );
  }

  if (role === "OBSERVER_PROFESSOR") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) return [];
    const courses = await listObserverCoursesForUser(userId, user.name);
    return Promise.all(
      courses.map(async (course) => ({
        ...course,
        questionCount: await countQuestions(course.id),
        customerCount: course._count?.observers ?? 0,
      }))
    );
  }

  return [];
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login/customer");

  const courses = await getCourses(session.user.id, session.user.role);
  const isProfessor = canManageCourse(session.user.role);
  const isObserver = session.user.role === "OBSERVER_PROFESSOR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">
          {isProfessor || isObserver
            ? SURVEY_LIST_LABEL
            : `${session.user.name} ${SURVEY_LIST_LABEL}`}
        </h1>
        {isProfessor && (
          <Link
            href="/dashboard/courses/new"
            className={`shrink-0 ${pillButtonPrimaryClass}`}
          >
            {ADD_SURVEY_LABEL}
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="mt-8 text-zinc-600">
          {isProfessor
            ? "아직 등록된 조사가 없습니다. 조사 추가로 새 조사를 만들어주세요."
            : "등록된 조사가 없습니다. 담당자가 고객으로 등록해 주시면 표시됩니다."}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {courses.map((course) => {
            if (isProfessor) {
              const joinUrl =
                "joinUrl" in course && typeof course.joinUrl === "string"
                  ? course.joinUrl
                  : null;

              return (
                <ProfessorEvaluationListCard
                  key={course.id}
                  courseId={course.id}
                  name={course.name}
                  semester={course.semester}
                  questionCount={course.questionCount}
                  customerCount={course.customerCount}
                  joinUrl={joinUrl}
                />
              );
            }

            const subtitle =
              "professorName" in course && course.professorName
                ? `담당자 ${course.professorName}`
                : undefined;

            return (
              <ReadonlyEvaluationListCard
                key={course.id}
                courseId={course.id}
                name={course.name}
                semester={course.semester}
                questionCount={course.questionCount}
                customerCount={course.customerCount}
                subtitle={subtitle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
