import { DeleteEvaluationButton } from "@/components/delete-evaluation-button";
import { LinkActions } from "@/components/link-actions";
import Link from "next/link";

function CardDivider() {
  return <div className="mx-5 border-t border-zinc-200" aria-hidden />;
}

function CourseParticipantStats({
  studentCount,
  observerCount,
}: {
  studentCount: number;
  observerCount: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-8 text-zinc-900">
      <div className="text-center">
        <p className="text-xs leading-tight text-zinc-500">참여학생</p>
        <p className="mt-0.5 text-base font-bold leading-tight">{studentCount}명</p>
      </div>
      <div className="text-center">
        <p className="text-xs leading-tight text-zinc-500">참관 교수</p>
        <p className="mt-0.5 text-base font-bold leading-tight">{observerCount}명</p>
      </div>
    </div>
  );
}

type ProfessorCardProps = {
  courseId: string;
  name: string;
  semester: string;
  studentCount: number;
  observerCount: number;
  joinUrl: string | null;
};

export function ProfessorEvaluationListCard({
  courseId,
  name,
  semester,
  studentCount,
  observerCount,
  joinUrl,
}: ProfessorCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-white">
      <div className="relative flex items-start justify-between gap-4 p-5">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="min-w-0 flex-1"
        >
          <p className="text-xs text-zinc-500">평가명</p>
          <h2 className="mt-0.5 text-xl font-bold text-zinc-900">{name}</h2>
        </Link>
        <div className="flex shrink-0 items-center gap-5">
          <CourseParticipantStats
            studentCount={studentCount}
            observerCount={observerCount}
          />
          <DeleteEvaluationButton
            courseId={courseId}
            evaluationName={name}
            variant="card-header"
          />
        </div>
      </div>

      <CardDivider />

      <div className="flex flex-wrap items-end justify-between gap-4 p-5">
        <Link href={`/dashboard/courses/${courseId}`}>
          <p className="text-xs text-zinc-500">평가 일시</p>
          <p className="mt-0.5 text-sm text-zinc-900">{semester}</p>
        </Link>
        {joinUrl && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-900">접속 링크</span>
            <LinkActions url={joinUrl} label={name} variant="pill" />
          </div>
        )}
      </div>
    </article>
  );
}

type ReadonlyCardProps = {
  courseId: string;
  name: string;
  semester: string;
  studentCount?: number;
  observerCount?: number;
  subtitle?: string;
};

export function ReadonlyEvaluationListCard({
  courseId,
  name,
  semester,
  studentCount,
  observerCount,
  subtitle,
}: ReadonlyCardProps) {
  return (
    <Link
      href={`/dashboard/courses/${courseId}`}
      className="block overflow-hidden rounded-xl border border-zinc-800 bg-white"
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">평가명</p>
          <h2 className="mt-0.5 text-xl font-bold text-zinc-900">{name}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        {studentCount !== undefined && (
          <CourseParticipantStats
            studentCount={studentCount}
            observerCount={observerCount ?? 0}
          />
        )}
      </div>
      <CardDivider />
      <div className="p-5">
        <p className="text-xs text-zinc-500">평가 일시</p>
        <p className="mt-0.5 text-sm text-zinc-900">{semester}</p>
      </div>
    </Link>
  );
}
