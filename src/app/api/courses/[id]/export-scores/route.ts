import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import { enrichPresentationsForResults } from "@/lib/course-results";
import { mergeProfessorFieldsBatch } from "@/lib/presentation-professor-fields";
import { sortPresentationsByPresenterName } from "@/lib/sort-presentations";
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
    where: { courseId: id },
    include: {
      presenter: { select: { studentId: true, name: true } },
      evaluations: { select: { empathyScore: true, isDraft: true } },
    },
  });

  const withProfessorFields = await mergeProfessorFieldsBatch(presentations);

  const rows = sortPresentationsByPresenterName(
    enrichPresentationsForResults(withProfessorFields, {
      weightPeer: course.weightPeer,
      weightObserver: course.weightObserver,
      weightLead: course.weightLead,
    })
  );

  const header = [
    "#",
    "학번",
    "이름",
    "평가 과제",
    "동료평가",
    "참관 교수 평가",
    "담당 교수 평가",
    "평가결과",
    "순위",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r, i) =>
      [
        i + 1,
        r.presenter.studentId ?? "",
        r.presenter.name,
        r.title ?? "",
        r.peerAverage ?? "",
        r.observerProfessorScore ?? "",
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
