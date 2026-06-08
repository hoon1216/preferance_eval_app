import type { Gender } from "@prisma/client";

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남",
  FEMALE: "여",
  OTHER: "기타",
};

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: GENDER_LABELS.MALE },
  { value: "FEMALE", label: GENDER_LABELS.FEMALE },
  { value: "OTHER", label: GENDER_LABELS.OTHER },
];

export function isGender(value: string): value is Gender {
  return value === "MALE" || value === "FEMALE" || value === "OTHER";
}

export function formatGender(gender: Gender | null | undefined) {
  if (!gender) return "—";
  return GENDER_LABELS[gender];
}
