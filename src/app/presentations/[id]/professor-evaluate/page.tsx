import { ProfessorAssignmentEvaluationPage } from "@/components/professor-assignment-evaluation-page";
import { MANAGER_EVAL_LABEL } from "@/lib/ui-labels";

export default function ProfessorEvaluatePage() {
  return (
    <ProfessorAssignmentEvaluationPage
      pageTitle={MANAGER_EVAL_LABEL}
      evaluationRole="lead"
    />
  );
}
