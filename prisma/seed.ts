import { DEFAULT_INITIAL_PASSWORD } from "../src/lib/default-password";
import { defaultOptionsForType } from "../src/lib/survey-item-types";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoCustomers = ["이고객", "박고객", "최고객"];

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

  await prisma.surveySection.deleteMany({ where: { courseId: course.id } });

  const section1 = await prisma.surveySection.create({
    data: {
      courseId: course.id,
      title: "서비스 이용 경험",
      description: "최근 이용 경험에 대한 문항입니다.",
      orderIndex: 0,
    },
  });

  const scaleItem = await prisma.surveyItem.create({
    data: {
      sectionId: section1.id,
      type: "LINEAR_SCALE",
      title: "전반적인 만족도는 어떠셨나요?",
      required: true,
      orderIndex: 0,
      options: defaultOptionsForType("LINEAR_SCALE"),
    },
  });

  const choiceItem = await prisma.surveyItem.create({
    data: {
      sectionId: section1.id,
      type: "SINGLE_CHOICE",
      title: "가장 자주 이용하는 기능은 무엇인가요?",
      required: true,
      orderIndex: 1,
      options: defaultOptionsForType("SINGLE_CHOICE"),
    },
  });

  const section2 = await prisma.surveySection.create({
    data: {
      courseId: course.id,
      title: "개선 의견",
      description: "자유롭게 의견을 남겨주세요.",
      orderIndex: 1,
    },
  });

  const textItem = await prisma.surveyItem.create({
    data: {
      sectionId: section2.id,
      type: "LONG_TEXT",
      title: "개선이 필요한 부분을 구체적으로 적어주세요.",
      required: false,
      orderIndex: 0,
      options: defaultOptionsForType("LONG_TEXT"),
    },
  });

  await prisma.surveyItemResponse.deleteMany({
    where: { item: { section: { courseId: course.id } } },
  });

  await prisma.surveyItemResponse.createMany({
    data: [
      {
        itemId: scaleItem.id,
        respondentId: customers[1].id,
        value: { scale: 4 },
      },
      {
        itemId: choiceItem.id,
        respondentId: customers[1].id,
        value: { selected: "옵션 1" },
      },
      {
        itemId: textItem.id,
        respondentId: customers[1].id,
        value: { text: "모바일 화면에서 버튼이 작아 불편했습니다." },
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`담당자: 김담당 / ${DEFAULT_INITIAL_PASSWORD}`);
  console.log("고객(평가자): 이고객, 박고객, 최고객 (이름만으로 접속)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
