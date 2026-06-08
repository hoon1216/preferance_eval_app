import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  COMMENT_LABEL,
  COMPLETENESS_LABEL,
  formatCompletenessScore,
  mergeEvaluationComment,
} from "@/lib/evaluation-labels";
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
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottom: "1pt solid #ccc",
    paddingBottom: 4,
  },
  row: { marginBottom: 4 },
  label: { fontWeight: "bold" },
  evalBlock: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
  },
  evalHeader: { fontWeight: "bold", marginBottom: 6 },
  scoreBox: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#eef4ff",
  },
});

export type FeedbackPdfProps = {
  courseName: string;
  semester: string;
  presenterName: string;
  presenterStudentId: string;
  title: string;
  overview: string;
  peerAverage: number | null;
  professorScore: number | null;
  finalGrade: number | null;
  evaluations: {
    evaluatorName: string;
    empathyScore: number;
    reason: string;
    suggestions: string;
  }[];
};

export function FeedbackPdfDocument(props: FeedbackPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>발표 피어 평가 피드백</Text>
        <Text style={styles.subtitle}>
          {props.courseName} · {props.semester}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>발표 정보</Text>
          <Text style={styles.row}>
            발표자: {props.presenterName} ({props.presenterStudentId})
          </Text>
          <Text style={styles.row}>제목: {props.title}</Text>
          <Text style={styles.row}>개요: {props.overview}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text>
            피어 {COMPLETENESS_LABEL} 평균: {props.peerAverage ?? "-"} / 10
          </Text>
          <Text>교수 평가: {props.professorScore ?? "-"} / 10</Text>
          <Text>최종 점수 (50%+50%): {props.finalGrade ?? "-"} / 10</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {COMMENT_LABEL} ({props.evaluations.length}건)
          </Text>
          {props.evaluations.map((e, i) => (
            <View key={`comment-${i}`} style={styles.evalBlock}>
              <Text style={styles.evalHeader}>
                {e.evaluatorName} · {COMPLETENESS_LABEL}{" "}
                {formatCompletenessScore(e.empathyScore)}점
              </Text>
              <Text>
                {mergeEvaluationComment(e.reason, e.suggestions)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
