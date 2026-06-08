import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import { enrichPresentationsForResults } from "@/lib/course-results";
import { mergeProfessorFieldsBatch } from "@/lib/presentation-professor-fields";
import { sortPresentationsByOrderIndex } from "@/lib/sort-presentations";
import { surveyQuestionFilter } from "@/lib/survey-questions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await userCanAccessCourse(
    id,
    session.user.id,
    session.user.role
  );
  if (!allowed || !canViewCourseResults(session.user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const presentations = await prisma.presentation.findMany({
    where: { courseId: id, ...surveyQuestionFilter },
    include: {
      evaluations: { select: { empathyScore: true, isDraft: true } },
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

  const withProfessorFields = await mergeProfessorFieldsBatch(presentations);

  const enriched = enrichPresentationsForResults(withProfessorFields, {
    weightPeer: course.weightPeer,
    weightObserver: course.weightObserver,
    weightLead: course.weightLead,
  });
  const rows = sortPresentationsByOrderIndex(enriched);

  const header = [
    "#",
    "질문 제목",
    "고객 의견",
    "담당자 의견",
    "조사 결과",
    "순위",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r, i) =>
      [
        i + 1,
        r.title ?? "",
        r.peerAverage ?? "",
        r.professorScore ?? "",
        r.finalGrade ?? "",
        r.rank ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];

  const bom = "\uFEFF";
  const filename = encodeURIComponent(`${course.name}_점수.csv`);

  return new NextResponse(bom + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
