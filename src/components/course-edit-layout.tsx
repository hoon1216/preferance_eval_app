"use client";

import Link from "next/link";

export function CourseEditLayout({
  courseId,
  title,
  courseName,
  action,
  children,
}: {
  courseId: string;
  title: string;
  courseName?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← 조사 대시보드
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {courseName && <p className="mt-1 text-zinc-600">{courseName}</p>}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
