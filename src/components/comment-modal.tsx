"use client";

import { GroupedEvaluationContent } from "@/components/grouped-evaluation-content";
import type { EvaluationContent } from "@/lib/evaluation-content";
import { hasGroupedEvaluationContent } from "@/lib/group-evaluation-content";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  items?: EvaluationContent[];
  emptyMessage?: string;
};

export function CommentModal({
  open,
  title,
  onClose,
  items,
  emptyMessage = "등록된 코멘트가 없습니다.",
}: Props) {
  if (!open) return null;

  const hasItems = items && hasGroupedEvaluationContent(items);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800"
          >
            닫기
          </button>
        </div>

        {hasItems && items ? (
          <div className="mt-4">
            <GroupedEvaluationContent items={items} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
