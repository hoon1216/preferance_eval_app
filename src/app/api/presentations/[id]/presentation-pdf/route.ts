import { auth } from "@/lib/auth";
import { canAccessPresentation } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  presentationPdfFileExists,
  readPresentationPdfBuffer,
} from "@/lib/presentation-pdf-storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canAccessPresentation(
    presentation,
    session.user.id,
    session.user.role
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const storedPath = presentation.presentationPdfPath;
  if (!storedPath || !(await presentationPdfFileExists(storedPath))) {
    return NextResponse.json({ error: "첨부된 PDF가 없습니다." }, { status: 404 });
  }

  const buffer = await readPresentationPdfBuffer(storedPath);
  const filename = encodeURIComponent(
    `${presentation.title ?? "발표"}_발표자료.pdf`
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${filename}`,
    },
  });
}
