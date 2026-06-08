import { PrismaClient } from "@prisma/client";
import { rm } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function clearUploads() {
  const uploadRoot = path.join(process.cwd(), "uploads");
  try {
    await rm(uploadRoot, { recursive: true, force: true });
    console.log(`업로드 폴더 삭제: ${uploadRoot}`);
  } catch {
    console.log("업로드 폴더 없음 (건너뜀)");
  }
}

async function clearDatabase() {
  const counts = await prisma.$transaction([
    prisma.evaluation.deleteMany(),
    prisma.presentation.deleteMany(),
    prisma.courseEnrollment.deleteMany(),
    prisma.courseObserver.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const labels = [
    "평가(Evaluation)",
    "발표(Presentation)",
    "수강 등록",
    "참관교수 슬롯",
    "평가(강의)",
    "회원(User)",
  ];
  labels.forEach((label, i) => {
    console.log(`${label} 삭제: ${counts[i].count}건`);
  });
}

async function main() {
  const seedAfter = process.argv.includes("--seed");

  console.log("=== 전체 데이터 초기화 ===");
  await clearDatabase();
  await clearUploads();

  if (seedAfter) {
    console.log("\n=== 데모 시드 실행 ===");
    const { execSync } = await import("child_process");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: process.cwd() });
  } else {
    console.log(
      "\n완료. 빈 DB입니다. 데모 데이터가 필요하면: npm run db:seed"
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
