import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dedupePresentations() {
  const rows = await prisma.presentation.findMany({
    orderBy: [{ courseId: "asc" }, { orderIndex: "asc" }, { createdAt: "asc" }],
    select: { id: true, courseId: true, presenterId: true },
  });

  const keep = new Set<string>();
  const removeIds: string[] = [];

  for (const row of rows) {
    const key = `${row.courseId}:${row.presenterId}`;
    if (keep.has(key)) {
      removeIds.push(row.id);
    } else {
      keep.add(key);
    }
  }

  if (removeIds.length === 0) {
    console.log("No duplicate presentations.");
    return;
  }

  await prisma.evaluation.deleteMany({
    where: { presentationId: { in: removeIds } },
  });
  const deleted = await prisma.presentation.deleteMany({
    where: { id: { in: removeIds } },
  });
  console.log(`Removed ${deleted.count} duplicate presentation(s).`);
}

async function main() {
  await dedupePresentations();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
