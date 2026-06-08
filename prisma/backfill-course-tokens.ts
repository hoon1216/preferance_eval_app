import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, accessToken: true },
  });

  let updated = 0;
  for (const course of courses) {
    if (course.accessToken) continue;
    const token = randomUUID();
    await prisma.course.update({
      where: { id: course.id },
      data: { accessToken: token },
    });
    updated += 1;
  }

  console.log(`평가 접속 토큰 보완: ${updated}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
