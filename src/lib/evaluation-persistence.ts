import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type EvaluationPayload = {
  presentationId: string;
  evaluatorId: string;
  empathyScore: number;
  reason: string;
  suggestions: string;
  isDraft: boolean;
};

function shouldUseRawEvaluationSql(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Unknown argument `isDraft`") ||
    msg.includes("Unknown field `isDraft`") ||
    msg.includes("Unknown argument `draft`") ||
    msg.includes("Unknown field `draft`") ||
    (msg.includes("PrismaClientValidationError") &&
      msg.includes("evaluation.create") &&
      msg.includes("draft"))
  );
}

export async function findMyEvaluation(
  presentationId: string,
  evaluatorId: string
) {
  try {
    return await prisma.evaluation.findUnique({
      where: {
        presentationId_evaluatorId: { presentationId, evaluatorId },
      },
    });
  } catch (err) {
    if (!shouldUseRawEvaluationSql(err)) throw err;
  }

  const rows = await prisma.$queryRaw<
    {
      id: string;
      presentationId: string;
      evaluatorId: string;
      empathyScore: number;
      reason: string;
      suggestions: string;
      isDraft: number;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >`
    SELECT id, presentationId, evaluatorId, empathyScore, reason, suggestions,
           isDraft, createdAt, updatedAt
    FROM Evaluation
    WHERE presentationId = ${presentationId} AND evaluatorId = ${evaluatorId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    presentationId: row.presentationId,
    evaluatorId: row.evaluatorId,
    empathyScore: row.empathyScore,
    reason: row.reason,
    suggestions: row.suggestions,
    isDraft: Boolean(row.isDraft),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function isEvaluationSubmitted(
  presentationId: string,
  evaluatorId: string
) {
  const existing = await findMyEvaluation(presentationId, evaluatorId);
  if (!existing) return false;
  return !existing.isDraft;
}

export async function upsertEvaluation(payload: EvaluationPayload) {
  const existing = await findMyEvaluation(
    payload.presentationId,
    payload.evaluatorId
  );

  if (existing && !existing.isDraft && !payload.isDraft) {
    return { error: "ALREADY_SUBMITTED" as const };
  }

  if (existing && !existing.isDraft && payload.isDraft) {
    return { error: "ALREADY_SUBMITTED" as const };
  }

  const isDraftInt = payload.isDraft ? 1 : 0;

  if (existing) {
    try {
      return {
        evaluation: await prisma.evaluation.update({
          where: { id: existing.id },
          data: {
            empathyScore: payload.empathyScore,
            reason: payload.reason,
            suggestions: payload.suggestions,
            isDraft: payload.isDraft,
          },
        }),
      };
    } catch (err) {
      if (!shouldUseRawEvaluationSql(err)) throw err;
      await prisma.$executeRaw`
        UPDATE Evaluation
        SET empathyScore = ${payload.empathyScore},
            reason = ${payload.reason},
            suggestions = ${payload.suggestions},
            isDraft = ${isDraftInt},
            updatedAt = datetime('now')
        WHERE id = ${existing.id}
      `;
      return {
        evaluation: await findMyEvaluation(
          payload.presentationId,
          payload.evaluatorId
        ),
      };
    }
  }

  const id = randomUUID();
  try {
    return {
      evaluation: await prisma.evaluation.create({
        data: {
          presentationId: payload.presentationId,
          evaluatorId: payload.evaluatorId,
          empathyScore: payload.empathyScore,
          reason: payload.reason,
          suggestions: payload.suggestions,
          isDraft: payload.isDraft,
        },
      }),
    };
  } catch (err) {
    if (!shouldUseRawEvaluationSql(err)) throw err;
    await prisma.$executeRaw`
      INSERT INTO Evaluation (
        id, presentationId, evaluatorId, empathyScore, reason, suggestions,
        isDraft, createdAt, updatedAt
      ) VALUES (
        ${id},
        ${payload.presentationId},
        ${payload.evaluatorId},
        ${payload.empathyScore},
        ${payload.reason},
        ${payload.suggestions},
        ${isDraftInt},
        datetime('now'),
        datetime('now')
      )
    `;
    return {
      evaluation: await findMyEvaluation(
        payload.presentationId,
        payload.evaluatorId
      ),
    };
  }
}

export async function listSubmittedEvaluations(presentationId: string) {
  try {
    const rows = await prisma.evaluation.findMany({
      where: { presentationId, isDraft: false },
      include: {
        evaluator: { select: { name: true, studentId: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return rows;
  } catch (err) {
    if (!shouldUseRawEvaluationSql(err)) throw err;
  }

  const rows = await prisma.$queryRaw<
    {
      id: string;
      empathyScore: number;
      reason: string;
      suggestions: string;
      evaluatorName: string;
      evaluatorStudentId: string | null;
    }[]
  >`
    SELECT e.id, e.empathyScore, e.reason, e.suggestions,
           u.name AS evaluatorName, u.studentId AS evaluatorStudentId
    FROM Evaluation e
    JOIN User u ON u.id = e.evaluatorId
    WHERE e.presentationId = ${presentationId} AND e.isDraft = 0
    ORDER BY e.createdAt ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    empathyScore: r.empathyScore,
    reason: r.reason,
    suggestions: r.suggestions,
    isDraft: false,
    evaluator: { name: r.evaluatorName, studentId: r.evaluatorStudentId },
  }));
}
