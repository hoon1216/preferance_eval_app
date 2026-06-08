import { DeleteEvaluationButton } from "@/components/delete-evaluation-button";
import { LinkActions } from "@/components/link-actions";
import {
  CUSTOMER_COUNT_LABEL,
  QUESTION_COUNT_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_NAME_LABEL,
} from "@/lib/ui-labels";
import Link from "next/link";

function CardDivider() {
  return <div className="mx-5 border-t border-zinc-200" aria-hidden />;
}

function CourseSurveyStats({
  questionCount,
  customerCount,
}: {
  questionCount: number;
  customerCount: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-8 text-zinc-900">
      <div className="text-center">
        <p className="text-xs leading-tight text-zinc-500">{QUESTION_COUNT_LABEL}</p>
        <p className="mt-0.5 text-base font-bold leading-tight">{questionCount}개</p>
      </div>
      <div className="text-center">
        <p className="text-xs leading-tight text-zinc-500">{CUSTOMER_COUNT_LABEL}</p>
        <p className="mt-0.5 text-base font-bold leading-tight">{customerCount}명</p>
      </div>
    </div>
  );
}

type ProfessorCardProps = {
  courseId: string;
  name: string;
  semester: string;
  questionCount: number;
  customerCount: number;
  joinUrl: string | null;
};

export function ProfessorEvaluationListCard({
  courseId,
  name,
  semester,
  questionCount,
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
        <div className="flex shrink-0 items-center gap-5">
          <CourseSurveyStats
            questionCount={questionCount}
            customerCount={customerCount}
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
  questionCount?: number;
  customerCount?: number;
  subtitle?: string;
};

export function ReadonlyEvaluationListCard({
  courseId,
  name,
  semester,
  questionCount,
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
        {questionCount !== undefined && (
          <CourseSurveyStats
            questionCount={questionCount}
            customerCount={customerCount ?? 0}
          />
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
