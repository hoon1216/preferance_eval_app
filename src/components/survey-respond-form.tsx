"use client";

import {
  isChoiceType,
  parseSurveyItemOptions,
  SURVEY_ITEM_TYPE_META,
  type SurveyItemOptions,
  type SurveyResponseValue,
} from "@/lib/survey-item-types";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { RATE_COMPLETE_LABEL, RATE_SUBMIT_LABEL } from "@/lib/ui-labels";
import type { SurveyItemType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type SurveyItem = {
  id: string;
  type: SurveyItemType;
  title: string;
  description: string | null;
  required: boolean;
  options: SurveyItemOptions;
};

type SurveySection = {
  id: string;
  title: string;
  description: string | null;
  items: SurveyItem[];
};

type CourseInfo = {
  id: string;
  name: string;
  semester: string;
};

export function SurveyRespondForm({ course }: { course: CourseInfo }) {
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [answers, setAnswers] = useState<Record<string, SurveyResponseValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [formRes, respRes] = await Promise.all([
      fetch(`/api/courses/${course.id}/survey-form`),
      fetch(`/api/courses/${course.id}/survey-responses`),
    ]);

    if (formRes.ok) {
      const data = await formRes.json();
      setSections(
        (data.sections ?? []).map((s: SurveySection) => ({
          ...s,
          items: s.items.map((item: SurveyItem) => ({
            ...item,
            options: parseSurveyItemOptions(item.options),
          })),
        }))
      );
    }

    if (respRes.ok) {
      const data = await respRes.json();
      const map: Record<string, SurveyResponseValue> = {};
      for (const r of data.responses ?? []) {
        map[r.itemId] = r.value as SurveyResponseValue;
      }
      setAnswers(map);
      setSubmitted(Boolean(data.submitted));
    }

    setLoading(false);
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  function setAnswer(itemId: string, value: SurveyResponseValue) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const responses = Object.entries(answers).map(([itemId, value]) => ({
      itemId,
      value,
    }));

    const res = await fetch(`/api/courses/${course.id}/survey-responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "제출 실패");
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return <p className="text-zinc-500">불러오는 중...</p>;
  }

  if (sections.length === 0) {
    return (
      <p className="text-center text-zinc-500 py-10">
        등록된 조사 문항이 없습니다.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 rounded-xl border border-violet-200 bg-violet-50 p-6">
        <h1 className="text-2xl font-bold text-violet-900">{course.name}</h1>
        <p className="mt-1 text-violet-800/80">{course.semester}</p>
      </div>

      {submitted && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {RATE_COMPLETE_LABEL} 응답이 저장되었습니다. 수정 후 다시 제출할 수 있습니다.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="bg-violet-700 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              {section.description && (
                <p className="mt-1 text-sm text-violet-100">{section.description}</p>
              )}
            </div>
            <div className="space-y-4 p-4">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <p className="font-medium text-zinc-900">
                      {item.title}
                      {item.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </p>
                    <span className="text-xs text-zinc-400">
                      {SURVEY_ITEM_TYPE_META[item.type].label}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                  )}

                  <div className="mt-3">
                    {item.type === "SHORT_TEXT" && (
                      <input
                        required={item.required}
                        value={
                          (answers[item.id] as { text?: string })?.text ?? ""
                        }
                        onChange={(e) =>
                          setAnswer(item.id, { text: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                      />
                    )}
                    {item.type === "LONG_TEXT" && (
                      <textarea
                        required={item.required}
                        rows={4}
                        value={
                          (answers[item.id] as { text?: string })?.text ?? ""
                        }
                        onChange={(e) =>
                          setAnswer(item.id, { text: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                      />
                    )}
                    {isChoiceType(item.type) && item.type !== "MULTIPLE_CHOICE" && (
                      <div className="space-y-2">
                        {(item.options.choices ?? []).map((choice) => (
                          <label
                            key={choice}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name={item.id}
                              required={item.required}
                              checked={
                                (answers[item.id] as { selected?: string })
                                  ?.selected === choice
                              }
                              onChange={() =>
                                setAnswer(item.id, { selected: choice })
                              }
                            />
                            {choice}
                          </label>
                        ))}
                      </div>
                    )}
                    {item.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2">
                        {(item.options.choices ?? []).map((choice) => {
                          const selected =
                            (answers[item.id] as { selected?: string[] })
                              ?.selected ?? [];
                          return (
                            <label
                              key={choice}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(choice)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...selected, choice]
                                    : selected.filter((c) => c !== choice);
                                  setAnswer(item.id, { selected: next });
                                }}
                              />
                              {choice}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {item.type === "LINEAR_SCALE" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          {item.options.scaleMinLabel ??
                            item.options.scaleMin ??
                            1}
                        </span>
                        {Array.from(
                          {
                            length:
                              (item.options.scaleMax ?? 5) -
                              (item.options.scaleMin ?? 1) +
                              1,
                          },
                          (_, i) => (item.options.scaleMin ?? 1) + i
                        ).map((n) => (
                          <label
                            key={n}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-300 text-sm has-[:checked]:border-violet-600 has-[:checked]:bg-violet-600 has-[:checked]:text-white"
                          >
                            <input
                              type="radio"
                              name={item.id}
                              className="sr-only"
                              required={item.required}
                              checked={
                                (answers[item.id] as { scale?: number })?.scale ===
                                n
                              }
                              onChange={() => setAnswer(item.id, { scale: n })}
                            />
                            {n}
                          </label>
                        ))}
                        <span className="text-xs text-zinc-500">
                          {item.options.scaleMaxLabel ??
                            item.options.scaleMax ??
                            5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-violet-700 py-3 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
        >
          {saving ? "제출 중..." : RATE_SUBMIT_LABEL}
        </button>
      </form>
    </div>
  );
}
