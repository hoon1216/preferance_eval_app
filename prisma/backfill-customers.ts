import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** 기존 고객의 이메일·학번을 제거하고 이름 접속을 활성화합니다. */
async function main() {
  const updated = await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: {
      email: null,
      studentId: null,
      profileComplete: true,
    },
  });

  console.log(`고객 계정 정리 완료: ${updated.count}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
