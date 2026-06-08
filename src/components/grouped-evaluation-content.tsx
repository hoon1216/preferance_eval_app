"use client";

import type { EvaluationContent } from "@/lib/evaluation-content";
import {
  collectComments,
  COMMENT_LABEL,
} from "@/lib/group-evaluation-content";

function QuestionAnswers({
  entries,
  emptyText = "등록된 내용이 없습니다.",
}: {
  entries: string[];
  emptyText?: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-5">
      {entries.map((text, i) => (
        <li key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {text}
        </li>
      ))}
    </ul>
  );
}

export function GroupedEvaluationContent({
  items,
}: {
  items: EvaluationContent[];
}) {
  const comments = collectComments(items);

  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <p className="text-sm font-semibold text-zinc-800">1. {COMMENT_LABEL}</p>
      <div className="mt-2">
        <QuestionAnswers entries={comments} />
      </div>
    </div>
  );
}
