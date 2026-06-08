import { DEFAULT_INITIAL_PASSWORD } from "../src/lib/default-password";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_INITIAL_PASSWORD, 10);

  const professor = await prisma.user.upsert({
    where: { email: "prof@example.com" },
    update: { profileComplete: true },
    create: {
      email: "prof@example.com",
      name: "김교수",
      passwordHash,
      role: "PROFESSOR",
      profileComplete: true,
    },
  });

  const students = await Promise.all(
    [
      { email: "student1@example.com", name: "이학생", studentId: "2024001" },
      { email: "student2@example.com", name: "박학생", studentId: "2024002" },
      { email: "student3@example.com", name: "최학생", studentId: "2024003" },
    ].map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: { profileComplete: true },
        create: {
          ...s,
          passwordHash,
          role: "STUDENT",
          profileComplete: true,
        },
      })
    )
  );

  const course = await prisma.course.upsert({
    where: { code: "DEMO2026" },
    update: {},
    create: {
      name: "디자인 현장경영 (데모)",
      semester: "2026-1학기",
      code: "DEMO2026",
      professorId: professor.id,
    },
  });

  for (const student of students) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: { courseId: course.id, studentId: student.id },
      },
      update: {},
      create: { courseId: course.id, studentId: student.id },
    });

    await prisma.presentation.upsert({
      where: {
        courseId_presenterId: {
          courseId: course.id,
          presenterId: student.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        presenterId: student.id,
        orderIndex: students.indexOf(student),
      },
    });
  }

  const presentation = await prisma.presentation.findFirst({
    where: { courseId: course.id, presenterId: students[0].id },
  });

  if (presentation) {
    await prisma.presentation.update({
      where: { id: presentation.id },
      data: {
        title: "스마트 홈 IoT 프로토타입",
        overview:
          "일상 생활 공간의 에너지 사용을 최적화하는 IoT 기반 스마트 홈 솔루션입니다.",
        status: "READY",
      },
    });

    await prisma.evaluation.deleteMany({ where: { presentationId: presentation.id } });
    await prisma.evaluation.createMany({
      data: [
        {
          presentationId: presentation.id,
          evaluatorId: students[1].id,
          empathyScore: 8,
          reason: "문제 정의가 명확하고 사용자 시나리오가 설득력 있습니다.",
          suggestions: "실제 사용자 테스트 데이터를 추가하면 좋겠습니다.",
        },
        {
          presentationId: presentation.id,
          evaluatorId: students[2].id,
          empathyScore: 7,
          reason: "기술 구현과 디자인 방향이 잘 맞습니다.",
          suggestions: "비용 구조와 상용화 로드맵을 보완해주세요.",
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`Professor: 김교수 / ${DEFAULT_INITIAL_PASSWORD}`);
  console.log(`Students: 이학생, 박학생, 최학생 / ${DEFAULT_INITIAL_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
