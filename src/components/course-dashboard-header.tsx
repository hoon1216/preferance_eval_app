"use client";

export function CourseDashboardHeader({
  name,
  semester,
  subtitle,
}: {
  name: string;
  semester: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="mt-1 text-zinc-600">{semester}</p>
      {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}
