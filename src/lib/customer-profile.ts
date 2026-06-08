import { isGender } from "@/lib/gender-labels";
import type { Gender } from "@prisma/client";

export type CustomerProfileInput = {
  birthDate: string;
  gender: Gender;
  occupation?: string | null;
  residenceRegion?: string | null;
  familyCount?: number | null;
  notes?: string | null;
};

const BIRTH_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCustomerProfile(body: Record<string, unknown>):
  | { ok: true; data: CustomerProfileInput }
  | { ok: false; error: string } {
  const birthDate = String(body.birthDate ?? "").trim();
  const genderRaw = String(body.gender ?? "").trim();

  if (!birthDate || !BIRTH_DATE_RE.test(birthDate)) {
    return { ok: false, error: "생년월일을 YYYY-MM-DD 형식으로 입력해주세요." };
  }

  if (!isGender(genderRaw)) {
    return { ok: false, error: "성별을 선택해주세요." };
  }

  const occupation = String(body.occupation ?? "").trim() || null;
  const residenceRegion = String(body.residenceRegion ?? "").trim() || null;
  const notes = String(body.notes ?? "").trim() || null;

  let familyCount: number | null = null;
  const familyRaw = body.familyCount;
  if (familyRaw !== undefined && familyRaw !== null && String(familyRaw).trim() !== "") {
    const parsed = Number(familyRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { ok: false, error: "가족수는 0 이상의 정수로 입력해주세요." };
    }
    familyCount = parsed;
  }

  return {
    ok: true,
    data: {
      birthDate,
      gender: genderRaw,
      occupation,
      residenceRegion,
      familyCount,
      notes,
    },
  };
}

export const customerProfileSelect = {
  birthDate: true,
  gender: true,
  occupation: true,
  residenceRegion: true,
  familyCount: true,
  notes: true,
} as const;
