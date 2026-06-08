import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const observerUsers = await prisma.user.findMany({
    where: { role: "OBSERVER_PROFESSOR" },
    select: { id: true },
  });
  const observerUserIds = observerUsers.map((u) => u.id);

  const deletedSlots = await prisma.courseObserver.deleteMany();
  const clearedScores = await prisma.presentation.updateMany({
    data: {
      observerProfessorScore: null,
      observerProfessorComment: null,
    },
  });
  const deletedUsers =
    observerUserIds.length > 0
      ? await prisma.user.deleteMany({
          where: { id: { in: observerUserIds }, role: "OBSERVER_PROFESSOR" },
        })
      : { count: 0 };

  console.log(`참관교수 슬롯 삭제: ${deletedSlots.count}건`);
  console.log(`발표 참관 점수·코멘트 초기화: ${clearedScores.count}건`);
  console.log(`참관교수 계정 삭제: ${deletedUsers.count}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
