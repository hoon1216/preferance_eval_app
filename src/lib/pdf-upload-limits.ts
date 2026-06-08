/** 발표 PDF 최대 크기 (50MB) */
export const MAX_PDF_BYTES = 50 * 1024 * 1024;

/** Vercel 서버리스 함수 본문 제한(약 4.5MB) — 이보다 크면 Blob 직접 업로드 필요 */
export const VERCEL_FUNCTION_BODY_LIMIT_BYTES = 4 * 1024 * 1024;

/** 서버에서 Blob 읽기/쓰기 가능 (OIDC 또는 READ_WRITE 토큰) */
export function useBlobPdfStorage() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

/** 브라우저 → Blob 직접 업로드 (handleUpload, 4MB 초과 파일용) */
export function useBlobClientUpload() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Vercel Blob 스토어 접근 방식 (스토어 생성 시 public/private 선택과 일치해야 함) */
export type BlobStoreAccess = "public" | "private";

export function blobStoreAccess(): BlobStoreAccess {
  const configured = process.env.BLOB_STORE_ACCESS?.trim().toLowerCase();
  if (configured === "public" || configured === "private") {
    return configured;
  }
  return "public";
}

export function formatPdfSizeLimitMb() {
  return Math.round(MAX_PDF_BYTES / (1024 * 1024));
}

export function isPdfFile(file: File) {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}
