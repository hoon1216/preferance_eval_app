import { DEFAULT_INITIAL_PASSWORD } from "../src/lib/default-password";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoCustomers = ["이고객", "박고객", "최고객"];

const demoQuestions = [
  {
    title: "제품 사용 경험은 어떠셨나요?",
    overview:
      "최근 이용하신 서비스의 전반적인 사용 경험과 만족도에 대해 자유롭게 의견을 남겨주세요.",
  },
  {
    title: "개선이 필요한 부분은 무엇인가요?",
    overview:
      "불편했던 점이나 개선되면 좋겠다고 생각하는 기능·디자인·절차 등을 구체적으로 적어주세요.",
  },
];

async function upsertCustomer(passwordHash: string, name: string) {
  const existing = await prisma.user.findFirst({
    where: { role: "OBSERVER_PROFESSOR", name },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { profileComplete: true, passwordHash },
    });
  }

  return prisma.user.create({
    data: {
      name,
      role: "OBSERVER_PROFESSOR",
      passwordHash,
      profileComplete: true,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_INITIAL_PASSWORD, 10);

  const professor = await prisma.user.upsert({
    where: { email: "prof@example.com" },
    update: { profileComplete: true },
    create: {
      email: "prof@example.com",
      name: "김담당",
      passwordHash,
      role: "PROFESSOR",
      profileComplete: true,
    },
  });

  const customers = await Promise.all(
    demoCustomers.map((name) => upsertCustomer(passwordHash, name))
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

  for (const customer of customers) {
    const existingSlot = await prisma.courseObserver.findFirst({
      where: { courseId: course.id, name: customer.name },
    });
    if (existingSlot) {
      await prisma.courseObserver.update({
        where: { id: existingSlot.id },
        data: { userId: customer.id },
      });
    } else {
      await prisma.courseObserver.create({
        data: {
          courseId: course.id,
          name: customer.name,
          userId: customer.id,
        },
      });
    }
  }

  await prisma.presentation.deleteMany({
    where: { courseId: course.id, presenterId: { not: null } },
  });

  for (let i = 0; i < demoQuestions.length; i++) {
    const q = demoQuestions[i];
    const existing = await prisma.presentation.findFirst({
      where: { courseId: course.id, presenterId: null, title: q.title },
    });

    if (existing) {
      await prisma.presentation.update({
        where: { id: existing.id },
        data: { overview: q.overview, orderIndex: i, status: "READY" },
      });
    } else {
      await prisma.presentation.create({
        data: {
          courseId: course.id,
          presenterId: null,
          title: q.title,
          overview: q.overview,
          orderIndex: i,
          status: "READY",
        },
      });
    }
  }

  const firstQuestion = await prisma.presentation.findFirst({
    where: { courseId: course.id, presenterId: null },
    orderBy: { orderIndex: "asc" },
  });

  if (firstQuestion) {
    await prisma.evaluation.deleteMany({
      where: { presentationId: firstQuestion.id },
    });
    await prisma.evaluation.createMany({
      data: [
        {
          presentationId: firstQuestion.id,
          evaluatorId: customers[1].id,
          empathyScore: 8,
          reason: "질문이 명확하고 응답하기 편했습니다.",
          suggestions: "선택지 예시를 추가하면 더 좋겠습니다.",
        },
        {
          presentationId: firstQuestion.id,
          evaluatorId: customers[2].id,
          empathyScore: 7,
          reason: "전반적으로 이해하기 쉬운 문항입니다.",
          suggestions: "응답 시간 안내를 넣어주세요.",
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`담당자: 김담당 / ${DEFAULT_INITIAL_PASSWORD}`);
  console.log("고객(평가자): 이고객, 박고객, 최고객 (이름만으로 접속)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
