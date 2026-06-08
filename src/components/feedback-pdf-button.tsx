"use client";

import { downloadFeedbackPdf } from "@/lib/download-feedback-pdf";
import { useState } from "react";

type Props = {
  presentationId: string;
  className: string;
  disabled?: boolean;
  disabledTitle?: string;
};

export function FeedbackPdfButton({
  presentationId,
  className,
  disabled = false,
  disabledTitle,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (disabled || loading) return;
    setLoading(true);
    const result = await downloadFeedbackPdf(presentationId);
    setLoading(false);
    if (!result.ok) {
      window.alert(result.error);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      title={disabled ? disabledTitle : undefined}
      onClick={handleClick}
      className={className}
    >
      {loading ? "생성 중..." : "PDF 다운"}
    </button>
  );
}
