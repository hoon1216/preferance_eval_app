"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  courseId: string;
  evaluationName: string;
  variant?: "floating" | "card-header";
};

const pillBtn =
  "rounded-full border-2 border-zinc-800 p-2 text-zinc-700 hover:border-red-500 hover:text-red-600 disabled:opacity-50";

export function DeleteEvaluationButton({
  courseId,
  evaluationName,
  variant = "floating",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = window.confirm(`"${evaluationName}" 평가를 삭제할까요?`);
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      window.alert("평가 삭제에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      aria-label="평가 삭제"
      title="평가 삭제"
      className={
        variant === "card-header"
          ? pillBtn
          : "absolute bottom-4 right-4 rounded-lg border border-zinc-300 bg-white p-2 text-zinc-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      }
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h16" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
