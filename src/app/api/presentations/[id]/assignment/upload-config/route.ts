import { auth } from "@/lib/auth";
import {
  blobStoreAccess,
  formatPdfSizeLimitMb,
  MAX_PDF_BYTES,
  useBlobClientUpload,
  useBlobPdfStorage,
  VERCEL_FUNCTION_BODY_LIMIT_BYTES,
} from "@/lib/pdf-upload-limits";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    select: { presenterId: true },
  });

  if (!presentation || presentation.presenterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobStorage = useBlobPdfStorage();
  const blobClientUpload = useBlobClientUpload();
  const maxMb = formatPdfSizeLimitMb();
  const directMb = Math.round(VERCEL_FUNCTION_BODY_LIMIT_BYTES / (1024 * 1024));

  let hint = `PDF는 최대 ${maxMb}MB까지 첨부할 수 있습니다.`;
  if (blobStorage && !blobClientUpload) {
    hint += ` ${directMb}MB 이하 파일은 서버 업로드, 그보다 큰 파일은 BLOB_READ_WRITE_TOKEN이 필요합니다.`;
  }
  if (blobStorage && !blobClientUpload) {
    hint +=
      " PDF 저장 오류가 나면 Vercel Storage에서 BLOB_READ_WRITE_TOKEN을 프로젝트에 연결한 뒤 Redeploy 해주세요.";
  }

  return NextResponse.json({
    useBlobStorage: blobStorage,
    useBlobClientUpload: blobClientUpload,
    blobAccess: blobStoreAccess(),
    maxPdfBytes: MAX_PDF_BYTES,
    maxPdfMb: maxMb,
    directUploadLimitBytes: VERCEL_FUNCTION_BODY_LIMIT_BYTES,
    hint,
  });
}
