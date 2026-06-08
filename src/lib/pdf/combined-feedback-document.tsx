import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { EvaluationContent } from "@/lib/evaluation-content";
import {
  collectComments,
  COMMENT_LABEL,
  hasGroupedEvaluationContent,
  mergeProfessorEvaluationItems,
} from "@/lib/group-evaluation-content";
import path from "node:path";

Font.register({
  family: "NotoSansKR",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSansCJKkr-Regular.otf"
      ),
      fontWeight: 400,
    },
    {
      src: path.join(
        process.cwd(),
        "public",
        "fonts",
        "NotoSansCJKkr-Bold.otf"
      ),
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "NotoSansKR" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 12, marginBottom: 20, color: "#444" },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: "1pt solid #333",
    paddingBottom: 4,
  },
  questionBlock: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
  },
  questionLabel: { fontWeight: "bold", marginBottom: 6 },
  answerLine: { marginBottom: 4, lineHeight: 1.4 },
  empty: { color: "#666", fontStyle: "italic" },
});

export type CombinedFeedbackPdfProps = {
  courseName: string;
  semester: string;
  presenterName: string;
  presenterStudentId: string;
  title: string;
  studentEvaluations: EvaluationContent[];
  observerEvaluation: EvaluationContent | null;
  professorEvaluation: EvaluationContent | null;
};

function QuestionSectionPdf({
  questionNumber,
  label,
  entries,
}: {
  questionNumber: number;
  label: string;
  entries: string[];
}) {
  return (
    <View style={styles.questionBlock}>
      <Text style={styles.questionLabel}>
        {questionNumber}. {label}
      </Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>등록된 내용이 없습니다.</Text>
      ) : (
        entries.map((text, i) => (
          <Text key={`${label}-${i}`} style={styles.answerLine}>
            • {text}
          </Text>
        ))
      )}
    </View>
  );
}

function GroupedItemsPdf({ items }: { items: EvaluationContent[] }) {
  if (!hasGroupedEvaluationContent(items)) {
    return <Text style={styles.empty}>등록된 내용이 없습니다.</Text>;
  }
  return (
    <QuestionSectionPdf
      questionNumber={1}
      label={COMMENT_LABEL}
      entries={collectComments(items)}
    />
  );
}

export function CombinedFeedbackPdfDocument(props: CombinedFeedbackPdfProps) {
  const professorItems = mergeProfessorEvaluationItems(
    props.observerEvaluation,
    props.professorEvaluation
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>발표 평가 종합 피드백</Text>
        <Text style={styles.subtitle}>
          {props.courseName} · {props.semester}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>발표 정보</Text>
          <Text>
            발표자: {props.presenterName} ({props.presenterStudentId})
          </Text>
          <Text>과제 제목: {props.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학생 평가</Text>
          <GroupedItemsPdf items={props.studentEvaluations} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>교수 평가</Text>
          <GroupedItemsPdf items={professorItems} />
        </View>
      </Page>
    </Document>
  );
}
