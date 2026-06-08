"use client";

import { pillButtonClass } from "@/lib/pill-button";

type Props = {
  url: string;
  label: string;
  variant?: "default" | "pill";
};

const pillBtnCompact = `${pillButtonClass} px-4 py-1`;

export function LinkActions({ url, label, variant = "default" }: Props) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      window.alert("접속 링크가 복사되었습니다.");
    } catch {
      window.prompt("아래 링크를 복사하세요.", url);
    }
  }

  async function shareLink() {
    const text = `${label} 접속 링크입니다.\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    const mail = `mailto:?subject=${encodeURIComponent(label)}&body=${encodeURIComponent(text)}`;
    window.location.href = mail;
  }

  if (variant === "pill") {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={shareLink} className={pillBtnCompact}>
          전달
        </button>
        <button type="button" onClick={copyLink} className={pillBtnCompact}>
          복사
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={copyLink}
        className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-50"
      >
        링크 복사
      </button>
      <button
        type="button"
        onClick={shareLink}
        className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
      >
        전달
      </button>
    </div>
  );
}
