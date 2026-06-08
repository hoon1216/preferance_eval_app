import {
  blobStoreAccess,
  MAX_PDF_BYTES,
  useBlobPdfStorage,
} from "@/lib/pdf-upload-limits";
import { del, head, put } from "@vercel/blob";
import { access, mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

export { MAX_PDF_BYTES, useBlobPdfStorage };

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const BLOB_PREFIX = "blob:";

export function presentationPdfRelativePath(presentationId: string) {
  return path.join("presentations", `${presentationId}.pdf`);
}

export function presentationPdfAbsolutePath(relativePath: string) {
  return path.join(UPLOAD_ROOT, relativePath);
}

export function isBlobPdfPath(storedPath: string | null) {
  return Boolean(storedPath?.startsWith(BLOB_PREFIX));
}

export function blobUrlFromStoredPath(storedPath: string) {
  return storedPath.slice(BLOB_PREFIX.length);
}

export function storedPathFromBlobUrl(url: string) {
  return `${BLOB_PREFIX}${url}`;
}

export function validatePdfBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function savePresentationPdf(presentationId: string, data: Buffer) {
  if (useBlobPdfStorage()) {
    return savePresentationPdfToBlob(presentationId, data);
  }

  const relative = presentationPdfRelativePath(presentationId);
  const absolute = presentationPdfAbsolutePath(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
  return relative;
}

export async function savePresentationPdfToBlob(
  presentationId: string,
  data: Buffer
) {
  const pathname = `presentations/${presentationId}.pdf`;
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const blob = await put(pathname, data, {
    access: blobStoreAccess(),
    contentType: "application/pdf",
    allowOverwrite: true,
    addRandomSuffix: false,
    ...(token ? { token } : {}),
  });
  return storedPathFromBlobUrl(blob.url);
}

export async function deletePresentationPdf(relativePath: string | null) {
  if (!relativePath) return;

  if (isBlobPdfPath(relativePath)) {
    try {
      await del(blobUrlFromStoredPath(relativePath));
    } catch {
      /* blob may already be missing */
    }
    return;
  }

  try {
    await unlink(presentationPdfAbsolutePath(relativePath));
  } catch {
    /* file may already be missing */
  }
}

export async function presentationPdfFileExists(relativePath: string | null) {
  if (!relativePath) return false;

  if (isBlobPdfPath(relativePath)) {
    try {
      await head(blobUrlFromStoredPath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  try {
    await access(presentationPdfAbsolutePath(relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function readPresentationPdfBuffer(storedPath: string): Promise<Buffer> {
  if (isBlobPdfPath(storedPath)) {
    const blobMeta = await head(blobUrlFromStoredPath(storedPath));
    const res = await fetch(blobMeta.downloadUrl);
    if (!res.ok) {
      throw new Error("Failed to download presentation PDF from blob storage");
    }
    return Buffer.from(await res.arrayBuffer());
  }

  return readFile(presentationPdfAbsolutePath(storedPath));
}
