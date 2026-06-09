import type { SurveyItemType } from "@prisma/client";

export type SurveyItemOptions = {
  choices?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export type SurveyResponseValue =
  | { text: string }
  | { selected: string }
  | { selected: string[] }
  | { scale: number };

export const SURVEY_ITEM_TYPE_META: Record<
  SurveyItemType,
  { label: string; description: string }
> = {
  SHORT_TEXT: { label: "단답형", description: "짧은 텍스트 응답" },
  LONG_TEXT: { label: "장문형", description: "긴 텍스트 응답" },
  SINGLE_CHOICE: { label: "객관식", description: "하나만 선택" },
  MULTIPLE_CHOICE: { label: "체크박스", description: "복수 선택" },
  DROPDOWN: { label: "드롭다운", description: "목록에서 선택" },
  LINEAR_SCALE: { label: "선형 배율", description: "숫자 척도" },
};

export const SURVEY_ITEM_TYPES = (
  Object.keys(SURVEY_ITEM_TYPE_META) as SurveyItemType[]
).map((value) => ({
  value,
  ...SURVEY_ITEM_TYPE_META[value],
}));

export function defaultOptionsForType(type: SurveyItemType): SurveyItemOptions {
  switch (type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return { choices: ["옵션 1", "옵션 2"] };
    case "LINEAR_SCALE":
      return {
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: "매우 불만족",
        scaleMaxLabel: "매우 만족",
      };
    default:
      return {};
  }
}

export function defaultTitleForType(type: SurveyItemType): string {
  return SURVEY_ITEM_TYPE_META[type].label;
}

export function parseSurveyItemOptions(raw: unknown): SurveyItemOptions {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as SurveyItemOptions;
  return {
    choices: Array.isArray(o.choices)
      ? o.choices.map((c) => String(c))
      : undefined,
    scaleMin: typeof o.scaleMin === "number" ? o.scaleMin : undefined,
    scaleMax: typeof o.scaleMax === "number" ? o.scaleMax : undefined,
    scaleMinLabel:
      typeof o.scaleMinLabel === "string" ? o.scaleMinLabel : undefined,
    scaleMaxLabel:
      typeof o.scaleMaxLabel === "string" ? o.scaleMaxLabel : undefined,
  };
}

export function isChoiceType(type: SurveyItemType) {
  return (
    type === "SINGLE_CHOICE" ||
    type === "MULTIPLE_CHOICE" ||
    type === "DROPDOWN"
  );
}
