export function averageEmpathyScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export function weightedFinalScore(
  peerAverage: number | null,
  observerScore: number | null,
  leadScore: number | null,
  weights: { peer: number; observer: number; lead: number }
): number | null {
  const parts: { score: number | null; weight: number }[] = [
    { score: peerAverage, weight: weights.peer },
    { score: observerScore, weight: weights.observer },
    { score: leadScore, weight: weights.lead },
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const { score, weight } of parts) {
    if (score === null || weight <= 0) continue;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export function assignRanks<T extends { finalGrade: number | null }>(
  rows: T[]
): (T & { rank: number | null })[] {
  const scored = rows
    .map((r, index) => ({ index, grade: r.finalGrade }))
    .filter((r): r is { index: number; grade: number } => r.grade !== null)
    .sort((a, b) => b.grade - a.grade);

  const ranks = new Map<number, number>();
  let rank = 1;
  for (let i = 0; i < scored.length; i++) {
    if (i > 0 && scored[i].grade < scored[i - 1].grade) {
      rank = i + 1;
    }
    ranks.set(scored[i].index, rank);
  }

  return rows.map((row, index) => ({
    ...row,
    rank: ranks.get(index) ?? null,
  }));
}

export function normalizeWeights(
  peer: number,
  observer: number,
  lead: number
): { peer: number; observer: number; lead: number } | null {
  const sum = peer + observer + lead;
  if (sum <= 0) return null;
  return {
    peer: (peer / sum) * 100,
    observer: (observer / sum) * 100,
    lead: (lead / sum) * 100,
  };
}
