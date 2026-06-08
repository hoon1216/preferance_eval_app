"use client";

import { isPdfFile } from "@/lib/pdf-upload-limits";
import { upload } from "@vercel/blob/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Presentation = {
  id: string;
  courseId: string;
  title: string | null;
  overview: string | null;
  status: string;
  hasPresentationPdf?: boolean;
  presenter: { name: string; studentId: string | null };
};

type UploadConfig = {
  useBlobStorage: boolean;
  useBlobClientUpload: boolean;
  blobAccess: "public" | "private";
  maxPdfBytes: number;
  maxPdfMb: number;
  directUploadLimitBytes: number;
  hint?: string;
};

export default function PrepPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const isEdit =
    Boolean(presentation?.title?.trim()) && Boolean(presentation?.overview?.trim());

  useEffect(() => {
    fetch(`/api/presentations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPresentation(data);
        setTitle(data.title ?? "");
        setOverview(data.overview ?? "");
      });

    fetch(`/api/presentations/${id}/assignment/upload-config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUploadConfig(data);
      });
  }, [id]);

  function validatePdfFile(file: File | null) {
    if (!file || !uploadConfig) return null;
    if (!isPdfFile(file)) {
      return "발표 PDF는 PDF 파일만 첨부할 수 있습니다.";
    }
    if (file.size > uploadConfig.maxPdfBytes) {
      return `PDF 파일은 ${uploadConfig.maxPdfMb}MB 이하만 업로드할 수 있습니다.`;
    }
    if (
      file.size > uploadConfig.directUploadLimitBytes &&
      !uploadConfig.useBlobClientUpload
    ) {
      return `${formatMb(file.size)} 파일은 4MB보다 큽니다. Vercel Storage에 BLOB_READ_WRITE_TOKEN을 추가해야 업로드할 수 있습니다.`;
    }
    return null;
  }

  function formatMb(bytes: number) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  async function saveAssignment(payload: {
    title: string;
    overview: string;
    removePdf: boolean;
    pdfBlobUrl?: string;
    pdfFile?: File | null;
  }) {
    const useBlobForFile =
      Boolean(payload.pdfFile) &&
      Boolean(uploadConfig?.useBlobClientUpload) &&
      payload.pdfFile!.size > (uploadConfig?.directUploadLimitBytes ?? 0);

    let pdfBlobUrl = payload.pdfBlobUrl;

    if (useBlobForFile && payload.pdfFile) {
      setUploadProgress(0);
      try {
        const blob = await upload(`presentations/${id}.pdf`, payload.pdfFile, {
          access: uploadConfig?.blobAccess ?? "public",
          handleUploadUrl: `/api/presentations/${id}/presentation-pdf/upload`,
          contentType: "application/pdf",
          multipart: payload.pdfFile.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploadProgress(Math.round(percentage));
          },
        });
        pdfBlobUrl = blob.url;
      } finally {
        setUploadProgress(null);
      }
    }

    if (useBlobForFile || pdfBlobUrl) {
      return fetch(`/api/presentations/${id}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          overview: payload.overview,
          removePdf: payload.removePdf,
          pdfBlobUrl: pdfBlobUrl ?? undefined,
        }),
      });
    }

    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("overview", payload.overview);
    if (payload.pdfFile) formData.append("pdf", payload.pdfFile);
    if (payload.removePdf) formData.append("removePdf", "true");

    return fetch(`/api/presentations/${id}/assignment`, {
      method: "POST",
      body: formData,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUploadProgress(null);

    const pdfError = validatePdfFile(pdfFile);
    if (pdfError) {
      setLoading(false);
      setError(pdfError);
      return;
    }

    try {
      const res = await saveAssignment({
        title,
        overview,
        removePdf,
        pdfFile,
      });

      const responseText = await res.text();
      let data: { error?: string } | null = null;
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText) as { error?: string };
        } catch {
          data = null;
        }
      }

      setLoading(false);
      setUploadProgress(null);

      if (!res.ok) {
        if (res.status === 413) {
          setError(
            "파일이 너무 커서 업로드할 수 없습니다. PDF 용량을 줄이거나 관리자에게 문의하세요."
          );
          return;
        }
        setError(
          data?.error ??
            (responseText.trim()
              ? responseText.slice(0, 200)
              : `제출에 실패했습니다. (${res.status})`)
        );
        return;
      }

      if (!presentation) return;
      router.push(`/dashboard/courses/${presentation.courseId}`);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setUploadProgress(null);
      setError(
        err instanceof Error ? err.message : "PDF 업로드 중 오류가 발생했습니다."
      );
    }
  }

  if (!presentation) {
    return <div className="mx-auto max-w-2xl px-4 py-10">불러오는 중...</div>;
  }

  const showExistingPdf =
    presentation.hasPresentationPdf && !removePdf && !pdfFile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← 이전 화면
      </button>
      <h1 className="mt-4 text-2xl font-bold">
        {isEdit ? "등록 과제 편집" : "발표 개요 제출"}
      </h1>
      <p className="mt-2 text-zinc-600">
        제목과 개요는 필수입니다. 발표 PDF는 선택 사항이며, 없어도 과제 등록이
        완료됩니다.
      </p>
      {uploadConfig?.hint && (
        <p className="mt-1 text-xs text-zinc-500">{uploadConfig.hint}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <div>
          <label className="block text-sm font-medium">발표 제목</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 제목을 입력하세요"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">발표 개요</label>
          <textarea
            required
            rows={8}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="프로젝트 배경, 목표, 핵심 내용, 기대 효과 등을 작성하세요"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            발표 PDF 첨부{" "}
            <span className="font-normal text-zinc-500">(선택)</span>
          </label>
          {showExistingPdf && (
            <p className="mt-2 text-sm text-zinc-600">
              현재 PDF가 첨부되어 있습니다.{" "}
              <a
                href={`/api/presentations/${id}/presentation-pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                미리보기
              </a>
            </p>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPdfFile(file);
              if (file) {
                setRemovePdf(false);
                const pdfError = validatePdfFile(file);
                setError(pdfError ?? "");
              }
            }}
            className="mt-2 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
          />
          {pdfFile && uploadConfig && (
            <p className="mt-1 text-xs text-zinc-500">
              선택한 파일: {pdfFile.name} ({formatMb(pdfFile.size)})
            </p>
          )}
          {showExistingPdf && (
            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={removePdf}
                onChange={(e) => setRemovePdf(e.target.checked)}
              />
              기존 PDF 삭제
            </label>
          )}
        </div>
        {uploadProgress !== null && (
          <p className="text-sm text-blue-700">
            PDF 업로드 중… {uploadProgress}%
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || presentation.status === "CLOSED"}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? uploadProgress !== null
              ? `PDF 업로드 중 (${uploadProgress}%)`
              : "저장 중..."
            : isEdit
              ? "과제 저장"
              : "과제 등록"}
        </button>
      </form>
    </div>
  );
}
