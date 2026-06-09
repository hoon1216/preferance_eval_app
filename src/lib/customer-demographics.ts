import { isGender } from "@/lib/gender-labels";
import type { Gender } from "@prisma/client";

export type CustomerDemographic = {
  gender?: Gender | null;
  age?: number | null;
};

export function parseCustomerGender(value: unknown): Gender | null {
  const raw = String(value ?? "").trim();
  return isGender(raw) ? raw : null;
}

export function parseCustomerAge(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 120) return null;
  return n;
}

export function ageDecadeLabel(age: number): string {
  const decade = Math.floor(age / 10) * 10;
  return `${decade}대`;
}

export function countByGender(customers: CustomerDemographic[]) {
  const counts: Record<string, number> = {};
  for (const customer of customers) {
    const key =
      customer.gender === "MALE"
        ? "남"
        : customer.gender === "FEMALE"
          ? "여"
          : customer.gender === "OTHER"
            ? "기타"
            : "미입력";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countByAgeGroup(customers: CustomerDemographic[]) {
  const counts: Record<string, number> = {};
  for (const customer of customers) {
    const key =
      customer.age != null && customer.age >= 0
        ? ageDecadeLabel(customer.age)
        : "미입력";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function sortedDemographicEntries(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => {
    if (a[0] === "미입력") return 1;
    if (b[0] === "미입력") return -1;
    const decadeA = parseInt(a[0], 10);
    const decadeB = parseInt(b[0], 10);
    if (!Number.isNaN(decadeA) && !Number.isNaN(decadeB)) {
      return decadeA - decadeB;
    }
    return a[0].localeCompare(b[0], "ko");
  });
}
