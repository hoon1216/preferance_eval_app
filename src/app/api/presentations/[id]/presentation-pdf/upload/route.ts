import { auth } from "@/lib/auth";
import {
  MAX_PDF_BYTES,
  useBlobClientUpload,
  useBlobPdfStorage,
} from "@/lib/pdf-upload-limits";
import { prisma } from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!useBlobPdfStorage()) {
    return NextResponse.json(
      { error: "Blob Storage가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  if (!useBlobClientUpload()) {
    return NextResponse.json(
      {
        error:
          "4MB보다 큰 PDF 업로드에는 BLOB_READ_WRITE_TOKEN 환경 변수가 필요합니다. Vercel Storage에서 토큰을 추가한 뒤 Redeploy 해주세요.",
      },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    select: { presenterId: true, status: true },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (presentation.presenterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (presentation.status === "CLOSED") {
    return NextResponse.json(
      { error: "마감된 발표는 수정할 수 없습니다." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  const expectedPrefix = `presentations/${id}`;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error("잘못된 업로드 경로입니다.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_PDF_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[presentation-pdf upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF 업로드에 실패했습니다." },
      { status: 400 }
    );
  }
}
