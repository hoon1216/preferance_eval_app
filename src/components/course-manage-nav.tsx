"use client";

import {
  SURVEY_BASIC_EDIT_SECTION_LABEL,
  SURVEY_CUSTOMER_MANAGE_SECTION_LABEL,
  SURVEY_QUESTION_EDIT_SECTION_LABEL,
} from "@/lib/ui-labels";
import { pillButtonClass } from "@/lib/pill-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = (
  courseId: string
): Array<{ href: string; label: string }> => [
  {
    href: `/dashboard/courses/${courseId}/edit`,
    label: SURVEY_BASIC_EDIT_SECTION_LABEL,
  },
  {
    href: `/dashboard/courses/${courseId}/customers`,
    label: SURVEY_CUSTOMER_MANAGE_SECTION_LABEL,
  },
  {
    href: `/dashboard/courses/${courseId}/form`,
    label: SURVEY_QUESTION_EDIT_SECTION_LABEL,
  },
];

export function CourseManageNav({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const items = navItems(courseId);

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${pillButtonClass} shrink-0 ${
              active ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
