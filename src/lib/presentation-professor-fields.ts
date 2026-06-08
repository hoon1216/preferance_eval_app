import { prisma } from "@/lib/prisma";
import type { Presentation, PresentationStatus } from "@prisma/client";

export type ProfessorFieldValues = {
  observerProfessorScore: number | null;
  observerProfessorComment: string | null;
  observerProfessorReason: string | null;
  observerProfessorSuggestions: string | null;
  observerEvaluationIsDraft: boolean;
  professorScore: number | null;
  professorComment: string | null;
  professorReason: string | null;
  professorSuggestions: string | null;
  professorEvaluationIsDraft: boolean;
};

type ProfessorFieldUpdate = Partial<ProfessorFieldValues> & {
  status?: PresentationStatus;
};

const professorFieldSelect = {
  observerProfessorScore: true,
  observerProfessorComment: true,
  observerProfessorReason: true,
  observerProfessorSuggestions: true,
  observerEvaluationIsDraft: true,
  professorScore: true,
  professorComment: true,
  professorReason: true,
  professorSuggestions: true,
  professorEvaluationIsDraft: true,
} as const;

type ProfessorFieldRow = {
  observerProfessorScore: number | null;
  observerProfessorComment: string | null;
  observerProfessorReason: string | null;
  observerProfessorSuggestions: string | null;
  observerEvaluationIsDraft: boolean | null;
  professorScore: number | null;
  professorComment: string | null;
  professorReason: string | null;
  professorSuggestions: string | null;
  professorEvaluationIsDraft: boolean | null;
};

function rowToProfessorFields(row?: ProfessorFieldRow | null): ProfessorFieldValues {
  return {
    observerProfessorScore: row?.observerProfessorScore ?? null,
    observerProfessorComment: row?.observerProfessorComment ?? null,
    observerProfessorReason: row?.observerProfessorReason ?? null,
    observerProfessorSuggestions: row?.observerProfessorSuggestions ?? null,
    observerEvaluationIsDraft: row?.observerEvaluationIsDraft ?? true,
    professorScore: row?.professorScore ?? null,
    professorComment: row?.professorComment ?? null,
    professorReason: row?.professorReason ?? null,
    professorSuggestions: row?.professorSuggestions ?? null,
    professorEvaluationIsDraft: row?.professorEvaluationIsDraft ?? true,
  };
}

export async function getProfessorFields(
  presentationId: string
): Promise<ProfessorFieldValues> {
  const row = await prisma.presentation.findUnique({
    where: { id: presentationId },
    select: professorFieldSelect,
  });

  return rowToProfessorFields(row);
}

export async function updatePresentationProfessorFields(
  presentationId: string,
  fields: ProfessorFieldUpdate
): Promise<Presentation> {
  return prisma.presentation.update({
    where: { id: presentationId },
    data: fields,
  });
}

export async function mergeProfessorFields<T extends Record<string, unknown>>(
  presentation: T,
  presentationId: string
): Promise<T & ProfessorFieldValues> {
  const professorFields = await getProfessorFields(presentationId);
  return { ...presentation, ...professorFields };
}

export async function mergeProfessorFieldsBatch<T extends { id: string }>(
  presentations: T[]
): Promise<(T & ProfessorFieldValues)[]> {
  if (presentations.length === 0) return [];

  const rows = await prisma.presentation.findMany({
    where: { id: { in: presentations.map((p) => p.id) } },
    select: { id: true, ...professorFieldSelect },
  });

  const byId = new Map(rows.map((r) => [r.id, rowToProfessorFields(r)]));
  return presentations.map((p) => ({
    ...p,
    ...(byId.get(p.id) ?? rowToProfessorFields(undefined)),
  }));
}
