"use client";

import { CourseManageNav } from "@/components/course-manage-nav";

export function CourseDashboardHeader({
  courseId,
  name,
  semester,
  subtitle,
  showManageNav = false,
}: {
  courseId: string;
  name: string;
  semester: string;
  subtitle?: string;
  showManageNav?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="mt-1 text-zinc-600">{semester}</p>
        {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {showManageNav && <CourseManageNav courseId={courseId} />}
    </div>
  );
}
