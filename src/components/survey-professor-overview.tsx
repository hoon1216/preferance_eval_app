"use client";

import { CourseDashboardHeader } from "@/components/course-dashboard-header";
import { CourseDashboardSection } from "@/components/course-dashboard-section";
import {
  isChoiceType,
  parseSurveyItemOptions,
  SURVEY_ITEM_TYPE_META,
} from "@/lib/survey-item-types";
import {
  PARTICIPANT_CUSTOMERS_LABEL,
  SURVEY_CONTENT_SECTION_LABEL,
} from "@/lib/ui-labels";
import type { SurveyItemType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type CourseInfo = {
  id: string;
  name: string;
  semester: string;
};

type ResponseRow = {
  itemId: string;
  value: unknown;
  respondent: { id: string; name: string };
  item: { id: string; title: string; type: string; sectionId: string };
};

type CustomerRow = {
  id: string;
  name: string;
};

function formatValue(value: unknown): string {
  if (!value || typeof value !== "object") return "—";
  if ("text" in value) return String(value.text);
  if ("selected" in value) {
    const s = value.selected;
    return Array.isArray(s) ? s.join(", ") : String(s);
  }
  if ("scale" in value) return String(value.scale);
  return "—";
}

export function SurveyProfessorOverview({ course }: { course: CourseInfo }) {
  const [sections, setSections] = useState<
    Array<{
      id: string;
      title: string;
      description: string | null;
      items: Array<{
        id: string;
        type: string;
        title: string;
        description: string | null;
        required: boolean;
        options: unknown;
      }>;
    }>
  >([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [formRes, respRes, customersRes] = await Promise.all([
      fetch(`/api/courses/${course.id}/survey-form`),
      fetch(`/api/courses/${course.id}/survey-responses`),
      fetch(`/api/courses/${course.id}/observers`),
    ]);
    if (formRes.ok) {
      const data = await formRes.json();
      setSections(data.sections ?? []);
    }
    if (respRes.ok) {
      const data = await respRes.json();
      setResponses(data.responses ?? []);
    }
    if (customersRes.ok) {
      const list = await customersRes.json();
      setCustomers(
        list.map((o: CustomerRow) => ({ id: o.id, name: o.name }))
      );
    }
    setLoading(false);
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  const respondentCount = new Set(responses.map((r) => r.respondent.id)).size;

  if (loading) return <p className="text-zinc-500">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <CourseDashboardHeader
        name={course.name}
        semester={course.semester}
        subtitle={`응답 고객 ${respondentCount}명 · 문항 응답 ${responses.length}건`}
      />

      <CourseDashboardSection
        title={PARTICIPANT_CUSTOMERS_LABEL}
        editHref={`/dashboard/courses/${course.id}/customers`}
      >
        {customers.length === 0 ? (
          <p className="text-sm text-zinc-500">등록된 참여 고객이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {customers.map((customer, index) => (
              <li
                key={customer.id}
                className="flex items-center gap-3 py-2 text-sm text-zinc-900"
              >
                <span className="w-6 text-zinc-400">{index + 1}</span>
                <span className="font-medium">{customer.name}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          총 {customers.length}명
        </p>
      </CourseDashboardSection>

      <CourseDashboardSection
        title={SURVEY_CONTENT_SECTION_LABEL}
        editHref={`/dashboard/courses/${course.id}/form`}
      >
        {sections.length === 0 ? (
          <p className="text-sm text-zinc-500">
            등록된 조사 문항이 없습니다. 편집에서 섹션과 문항을 추가해주세요.
          </p>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-lg border border-zinc-200"
              >
                <div className="bg-violet-700 px-4 py-3">
                  <h3 className="font-semibold text-white">{section.title}</h3>
                  {section.description && (
                    <p className="mt-1 text-sm text-violet-100">
                      {section.description}
                    </p>
                  )}
                </div>
                <div className="divide-y divide-zinc-100">
                  {section.items.map((item) => {
                    const itemResponses = responses.filter(
                      (r) => r.itemId === item.id
                    );
                    const opts = parseSurveyItemOptions(item.options);
                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          <span className="text-xs text-zinc-400">
                            {SURVEY_ITEM_TYPE_META[
                              item.type as keyof typeof SURVEY_ITEM_TYPE_META
                            ]?.label ?? item.type}
                          </span>
                          {item.required && (
                            <span className="text-xs text-red-500">필수</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {item.description}
                          </p>
                        )}
                        {isChoiceType(item.type as SurveyItemType) &&
                          opts.choices && (
                            <p className="mt-1 text-xs text-zinc-400">
                              옵션: {opts.choices.join(", ")}
                            </p>
                          )}
                        <div className="mt-3 space-y-2">
                          {itemResponses.length === 0 ? (
                            <p className="text-sm text-zinc-400">응답 없음</p>
                          ) : (
                            itemResponses.map((r) => (
                              <div
                                key={`${r.itemId}-${r.respondent.id}`}
                                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-zinc-700">
                                  {r.respondent.name}
                                </span>
                                <span className="mx-2 text-zinc-300">·</span>
                                <span className="text-zinc-600">
                                  {formatValue(r.value)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CourseDashboardSection>
    </div>
  );
}
