import { pillButtonSmClass } from "@/lib/pill-button";
import Link from "next/link";

export function CourseDashboardSection({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <Link href={editHref} className={`${pillButtonSmClass} shrink-0`}>
          편집
        </Link>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
