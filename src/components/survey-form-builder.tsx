"use client";

import {
  isChoiceType,
  parseSurveyItemOptions,
  SURVEY_ITEM_TYPE_META,
  SURVEY_ITEM_TYPES,
  type SurveyItemOptions,
} from "@/lib/survey-item-types";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { SurveyItemType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type SurveyItem = {
  id: string;
  type: SurveyItemType;
  title: string;
  description: string | null;
  required: boolean;
  orderIndex: number;
  options: SurveyItemOptions;
};

type SurveySection = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  items: SurveyItem[];
};

function ChoiceOptionsEditor({
  options,
  onChange,
}: {
  options: SurveyItemOptions;
  onChange: (options: SurveyItemOptions) => void;
}) {
  const choices = options.choices ?? [];

  function updateChoice(index: number, value: string) {
    const next = [...choices];
    next[index] = value;
    onChange({ ...options, choices: next });
  }

  function addChoice() {
    onChange({ ...options, choices: [...choices, `옵션 ${choices.length + 1}`] });
  }

  function removeChoice(index: number) {
    if (choices.length <= 1) return;
    onChange({
      ...options,
      choices: choices.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {choices.map((choice, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{index + 1}.</span>
          <input
            value={choice}
            onChange={(e) => updateChoice(index, e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => removeChoice(index)}
            className="text-xs text-red-600 hover:underline"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addChoice}
        className="text-sm text-blue-600 hover:underline"
      >
        + 옵션 추가
      </button>
    </div>
  );
}

function ScaleOptionsEditor({
  options,
  onChange,
}: {
  options: SurveyItemOptions;
  onChange: (options: SurveyItemOptions) => void;
}) {
  const min = options.scaleMin ?? 1;
  const max = options.scaleMax ?? 5;

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        최소값
        <input
          type="number"
          min={0}
          max={10}
          value={min}
          onChange={(e) =>
            onChange({ ...options, scaleMin: Number(e.target.value) })
          }
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        최대값
        <input
          type="number"
          min={1}
          max={10}
          value={max}
          onChange={(e) =>
            onChange({ ...options, scaleMax: Number(e.target.value) })
          }
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        최소 라벨
        <input
          value={options.scaleMinLabel ?? ""}
          onChange={(e) =>
            onChange({ ...options, scaleMinLabel: e.target.value })
          }
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        최대 라벨
        <input
          value={options.scaleMaxLabel ?? ""}
          onChange={(e) =>
            onChange({ ...options, scaleMaxLabel: e.target.value })
          }
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}

function ItemPreview({
  type,
  options,
}: {
  type: SurveyItemType;
  options: SurveyItemOptions;
}) {
  if (type === "SHORT_TEXT") {
    return (
      <input
        disabled
        placeholder="단답형 텍스트"
        className="mt-3 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400"
      />
    );
  }
  if (type === "LONG_TEXT") {
    return (
      <textarea
        disabled
        rows={3}
        placeholder="장문형 텍스트"
        className="mt-3 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400"
      />
    );
  }
  if (isChoiceType(type)) {
    const choices = options.choices ?? [];
    return (
      <div className="mt-3 space-y-2">
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="h-4 w-4 rounded-full border border-zinc-300" />
            {c}
          </div>
        ))}
      </div>
    );
  }
  if (type === "LINEAR_SCALE") {
    const min = options.scaleMin ?? 1;
    const max = options.scaleMax ?? 5;
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>{options.scaleMinLabel ?? min}</span>
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <span
            key={n}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300"
          >
            {n}
          </span>
        ))}
        <span>{options.scaleMaxLabel ?? max}</span>
      </div>
    );
  }
  return null;
}

export function SurveyFormBuilder({ courseId }: { courseId: string }) {
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingTypeForSection, setAddingTypeForSection] = useState<string | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/survey-form`);
    if (!res.ok) {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "조사 문항을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setSections(
      (data.sections ?? []).map((s: SurveySection) => ({
        ...s,
        items: s.items.map((item: SurveyItem) => ({
          ...item,
          options: parseSurveyItemOptions(item.options),
        })),
      }))
    );
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addSection() {
    setError("");
    const res = await fetch(`/api/courses/${courseId}/survey-sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "새 섹션" }),
    });
    if (!res.ok) {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "섹션 추가 실패");
      return;
    }
    await load();
  }

  async function updateSection(
    sectionId: string,
    patch: Partial<Pick<SurveySection, "title" | "description">>
  ) {
    await fetch(`/api/courses/${courseId}/survey-sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function deleteSection(sectionId: string) {
    if (!window.confirm("이 섹션과 포함된 문항을 모두 삭제할까요?")) return;
    setError("");
    const res = await fetch(
      `/api/courses/${courseId}/survey-sections/${sectionId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "섹션 삭제 실패");
      return;
    }
    await load();
  }

  async function addItem(sectionId: string, type: SurveyItemType) {
    setAddingTypeForSection(null);
    setError("");
    const res = await fetch(
      `/api/courses/${courseId}/survey-sections/${sectionId}/items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }
    );
    if (!res.ok) {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "문항 추가 실패");
      return;
    }
    await load();
  }

  async function updateItem(
    sectionId: string,
    itemId: string,
    patch: Partial<
      Pick<SurveyItem, "title" | "description" | "required"> & {
        options?: SurveyItemOptions;
      }
    >
  ) {
    await fetch(
      `/api/courses/${courseId}/survey-sections/${sectionId}/items/${itemId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
  }

  async function deleteItem(sectionId: string, itemId: string) {
    if (!window.confirm("이 문항을 삭제할까요?")) return;
    const res = await fetch(
      `/api/courses/${courseId}/survey-sections/${sectionId}/items/${itemId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const json = await parseJsonResponse<{ error?: string }>(res);
      setError(json?.error ?? "문항 삭제 실패");
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">조사 문항을 불러오는 중...</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-zinc-600">아직 섹션이 없습니다.</p>
          <p className="mt-1 text-sm text-zinc-500">
            섹션을 추가한 뒤 문항 유형을 선택해 조사를 구성하세요.
          </p>
        </div>
      ) : (
        sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="bg-violet-700 px-4 py-3">
              <input
                value={section.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === section.id ? { ...s, title } : s
                    )
                  );
                }}
                onBlur={(e) =>
                  updateSection(section.id, { title: e.target.value.trim() })
                }
                className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-violet-200 focus:outline-none"
                placeholder="섹션 제목"
              />
            </div>

            <div className="border-b border-zinc-100 px-4 py-3">
              <textarea
                value={section.description ?? ""}
                onChange={(e) => {
                  const description = e.target.value;
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === section.id ? { ...s, description } : s
                    )
                  );
                }}
                onBlur={(e) =>
                  updateSection(section.id, {
                    description: e.target.value.trim() || null,
                  })
                }
                rows={2}
                placeholder="섹션 설명 (선택)"
                className="w-full resize-none text-sm text-zinc-600 focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => deleteSection(section.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  섹션 삭제
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {section.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="rounded bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
                        {SURVEY_ITEM_TYPE_META[item.type].label}
                      </span>
                      <span>
                        섹션 {sectionIndex + 1} · 문항 {itemIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => {
                            const required = e.target.checked;
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      items: s.items.map((it) =>
                                        it.id === item.id
                                          ? { ...it, required }
                                          : it
                                      ),
                                    }
                                  : s
                              )
                            );
                            updateItem(section.id, item.id, { required });
                          }}
                        />
                        필수
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteItem(section.id, item.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <input
                    value={item.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setSections((prev) =>
                        prev.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                items: s.items.map((it) =>
                                  it.id === item.id ? { ...it, title } : it
                                ),
                              }
                            : s
                        )
                      );
                    }}
                    onBlur={(e) =>
                      updateItem(section.id, item.id, {
                        title: e.target.value.trim(),
                      })
                    }
                    className="mt-3 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium"
                    placeholder="문항 제목"
                  />

                  <input
                    value={item.description ?? ""}
                    onChange={(e) => {
                      const description = e.target.value;
                      setSections((prev) =>
                        prev.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                items: s.items.map((it) =>
                                  it.id === item.id
                                    ? { ...it, description }
                                    : it
                                ),
                              }
                            : s
                        )
                      );
                    }}
                    onBlur={(e) =>
                      updateItem(section.id, item.id, {
                        description: e.target.value.trim() || null,
                      })
                    }
                    className="mt-2 w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600"
                    placeholder="도움말 (선택)"
                  />

                  {isChoiceType(item.type) && (
                    <ChoiceOptionsEditor
                      options={item.options}
                      onChange={(options) => {
                        setSections((prev) =>
                          prev.map((s) =>
                            s.id === section.id
                              ? {
                                  ...s,
                                  items: s.items.map((it) =>
                                    it.id === item.id ? { ...it, options } : it
                                  ),
                                }
                              : s
                          )
                        );
                        updateItem(section.id, item.id, { options });
                      }}
                    />
                  )}

                  {item.type === "LINEAR_SCALE" && (
                    <ScaleOptionsEditor
                      options={item.options}
                      onChange={(options) => {
                        setSections((prev) =>
                          prev.map((s) =>
                            s.id === section.id
                              ? {
                                  ...s,
                                  items: s.items.map((it) =>
                                    it.id === item.id ? { ...it, options } : it
                                  ),
                                }
                              : s
                          )
                        );
                        updateItem(section.id, item.id, { options });
                      }}
                    />
                  )}

                  <ItemPreview type={item.type} options={item.options} />
                </div>
              ))}

              {addingTypeForSection === section.id ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    문항 유형 선택
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SURVEY_ITEM_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => addItem(section.id, t.value)}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingTypeForSection(null)}
                    className="mt-2 text-xs text-zinc-500 hover:underline"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTypeForSection(section.id)}
                  className="w-full rounded-lg border border-dashed border-zinc-300 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  + 문항 추가
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 py-4 text-sm font-medium text-violet-800 hover:bg-violet-100"
      >
        + 섹션 추가
      </button>
    </div>
  );
}
