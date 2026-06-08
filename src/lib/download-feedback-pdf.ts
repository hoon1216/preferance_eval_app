function filenameFromDisposition(header: string | null) {
  if (!header) return "평가_피드백.pdf";
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1] ?? "평가_피드백.pdf";
}

export async function downloadFeedbackPdf(
  presentationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/presentations/${presentationId}/feedback-pdf`, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error ?? "PDF 생성에 실패했습니다." };
    }
    return { ok: false, error: "PDF 생성에 실패했습니다." };
  }

  const blob = await res.blob();
  if (!blob.size || blob.type.includes("json")) {
    return { ok: false, error: "PDF 파일을 받지 못했습니다." };
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filenameFromDisposition(
    res.headers.get("Content-Disposition")
  );
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { ok: true };
}
