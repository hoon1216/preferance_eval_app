import { ProfessorAssignmentEvaluationPage } from "@/components/professor-assignment-evaluation-page";
import { TEAM_MEMBER_EVAL_LABEL } from "@/lib/ui-labels";

export default function ObserverEvaluatePage() {
  return (
    <ProfessorAssignmentEvaluationPage
      pageTitle={TEAM_MEMBER_EVAL_LABEL}
      evaluationRole="observer"
    />
  );
}
