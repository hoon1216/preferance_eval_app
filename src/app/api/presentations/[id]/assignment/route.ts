import { apiErrorMessage } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { isPdfFile, MAX_PDF_BYTES } from "@/lib/pdf-upload-limits";
import { prisma } from "@/lib/prisma";
import {
  deletePresentationPdf,
  savePresentationPdf,
  storedPathFromBlobUrl,
  validatePdfBlobUrl,
} from "@/lib/presentation-pdf-storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 60;

async function assertStudentPresentation(id: string, userId: string) {
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!presentation) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  if (presentation.presenterId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (presentation.status === "CLOSED") {
    return {
      error: NextResponse.json(
        { error: "마감된 발표는 수정할 수 없습니다." },
        { status: 400 }
      ),
    };
  }

  return { presentation };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const access = await assertStudentPresentation(id, session.user.id);
    if (access.error) return access.error;
    const presentation = access.presentation!;

    const contentType = request.headers.get("content-type") ?? "";
    let title = "";
    let overview = "";
    let removePdf = false;
    let pdfBlobUrl: string | null = null;
    let pdfFile: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      title = String(body.title ?? "").trim();
      overview = String(body.overview ?? "").trim();
      removePdf = body.removePdf === true;
      pdfBlobUrl = body.pdfBlobUrl ? String(body.pdfBlobUrl) : null;
    } else {
      const formData = await request.formData();
      title = String(formData.get("title") ?? "").trim();
      overview = String(formData.get("overview") ?? "").trim();
      removePdf = formData.get("removePdf") === "true";
      const pdfEntry = formData.get("pdf");
      if (pdfEntry && pdfEntry instanceof File && pdfEntry.size > 0) {
        pdfFile = pdfEntry;
      }
    }

    if (!title || !overview) {
      return NextResponse.json(
        { error: "제목과 개요를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    let presentationPdfPath = presentation.presentationPdfPath;

    if (removePdf) {
      await deletePresentationPdf(presentationPdfPath);
      presentationPdfPath = null;
    }

    if (pdfBlobUrl) {
      if (!validatePdfBlobUrl(pdfBlobUrl)) {
        return NextResponse.json(
          { error: "유효하지 않은 PDF 업로드입니다." },
          { status: 400 }
        );
      }
      if (presentationPdfPath) {
        await deletePresentationPdf(presentationPdfPath);
      }
      presentationPdfPath = storedPathFromBlobUrl(pdfBlobUrl);
    } else if (pdfFile) {
      if (!isPdfFile(pdfFile)) {
        return NextResponse.json(
          { error: "발표 PDF는 PDF 파일만 첨부할 수 있습니다." },
          { status: 400 }
        );
      }
      if (pdfFile.size > MAX_PDF_BYTES) {
        return NextResponse.json(
          {
            error: `PDF 파일은 ${Math.round(MAX_PDF_BYTES / (1024 * 1024))}MB 이하만 업로드할 수 있습니다.`,
          },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      if (presentationPdfPath) {
        await deletePresentationPdf(presentationPdfPath);
      }
      presentationPdfPath = await savePresentationPdf(presentation.id, buffer);
    }

    const updated = await prisma.presentation.update({
      where: { id },
      data: {
        title,
        overview,
        presentationPdfPath,
        status: "READY",
      },
    });

    return NextResponse.json({
      ...updated,
      hasPresentationPdf: Boolean(updated.presentationPdfPath),
    });
  } catch (err) {
    console.error("POST /api/presentations/[id]/assignment failed:", err);
    return NextResponse.json({ error: apiErrorMessage(err) }, { status: 500 });
  }
}
