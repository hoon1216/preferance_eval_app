"use client";

import {
  NEW_SURVEY_LABEL,
  SURVEY_CREATE_LABEL,
  SURVEY_DATETIME_LABEL,
  SURVEY_LABEL,
  SURVEY_NAME_LABEL,
} from "@/lib/ui-labels";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, semester }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? `${SURVEY_LABEL} 생성에 실패했습니다.`);
      return;
    }

    router.push(`/dashboard/courses/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">{NEW_SURVEY_LABEL}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">{SURVEY_NAME_LABEL}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 3월 제품 선호도 조사"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{SURVEY_DATETIME_LABEL}</label>
          <input
            required
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="예: 2026-06-10 14:00"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "생성 중..." : SURVEY_CREATE_LABEL}
        </button>
      </form>
    </div>
  );
}
