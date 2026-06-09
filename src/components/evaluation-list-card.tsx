import { DeleteEvaluationButton } from "@/components/delete-evaluation-button";
import { LinkActions } from "@/components/link-actions";
import { pillButtonClass } from "@/lib/pill-button";
import {
  CUSTOMER_COUNT_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_NAME_LABEL,
} from "@/lib/ui-labels";
import Link from "next/link";

function CardDivider() {
  return <div className="mx-5 border-t border-zinc-200" aria-hidden />;
}

function CourseCustomerStat({ customerCount }: { customerCount: number }) {
  return (
    <div className="shrink-0 text-center text-zinc-900">
      <p className="text-xs leading-tight text-zinc-500">{CUSTOMER_COUNT_LABEL}</p>
      <p className="mt-0.5 text-base font-bold leading-tight">{customerCount}명</p>
    </div>
  );
}

type ProfessorCardProps = {
  courseId: string;
  name: string;
  semester: string;
  customerCount: number;
  joinUrl: string | null;
};

export function ProfessorEvaluationListCard({
  courseId,
  name,
  semester,
  customerCount,
  joinUrl,
}: ProfessorCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-white">
      <div className="relative flex items-start justify-between gap-4 p-5">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="min-w-0 flex-1"
        >
          <p className="text-xs text-zinc-500">{SURVEY_NAME_LABEL}</p>
          <h2 className="mt-0.5 text-xl font-bold text-zinc-900">{name}</h2>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <CourseCustomerStat customerCount={customerCount} />
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className={`${pillButtonClass} shrink-0`}
          >
            수정
          </Link>
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
          <p className="text-xs text-zinc-500">{SURVEY_DATETIME_LABEL}</p>
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
  customerCount?: number;
  subtitle?: string;
};

export function ReadonlyEvaluationListCard({
  courseId,
  name,
  semester,
  customerCount,
  subtitle,
}: ReadonlyCardProps) {
  return (
    <Link
      href={`/dashboard/courses/${courseId}`}
      className="block overflow-hidden rounded-xl border border-zinc-800 bg-white"
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">{SURVEY_NAME_LABEL}</p>
          <h2 className="mt-0.5 text-xl font-bold text-zinc-900">{name}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        {customerCount !== undefined && (
          <CourseCustomerStat customerCount={customerCount} />
        )}
      </div>
      <CardDivider />
      <div className="p-5">
        <p className="text-xs text-zinc-500">{SURVEY_DATETIME_LABEL}</p>
        <p className="mt-0.5 text-sm text-zinc-900">{semester}</p>
      </div>
    </Link>
  );
}
