import { averageEmpathyScore, assignRanks, weightedFinalScore } from "@/lib/grades";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import {
  submittedLeadScore,
  submittedObserverScore,
} from "@/lib/professor-evaluation-display";

type PresentationWithEvals = {
  id: string;
  title: string | null;
  professorScore: number | null;
  observerProfessorScore: number | null;
  evaluations: { empathyScore: number; isDraft?: boolean }[];
  presenter: {
    name: string;
    studentId: string | null;
    id?: string;
    email?: string | null;
  };
  [key: string]: unknown;
};

type CourseWeights = {
  weightPeer: number;
  weightObserver: number;
  weightLead: number;
};

export function enrichPresentationsForResults(
  presentations: PresentationWithEvals[],
  weights: CourseWeights
) {
  const rows = presentations.map((p) => {
    const submitted = submittedEvaluations(p.evaluations);
    const empathyScores = submitted.map((e) => e.empathyScore);
    const peerAverage = averageEmpathyScore(empathyScores);
    const w = {
      peer: weights.weightPeer,
      observer: weights.weightObserver,
      lead: weights.weightLead,
    };
    const observerProfessorScore = submittedObserverScore(p);
    const professorScore = submittedLeadScore(p);
    const finalGrade = weightedFinalScore(
      peerAverage,
      observerProfessorScore,
      professorScore,
      w
    );
    return {
      ...p,
      peerAverage,
      observerProfessorScore,
      professorScore,
      finalGrade,
      evaluationCount: submitted.length,
    };
  });

  return assignRanks(rows);
}
