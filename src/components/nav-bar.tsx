"use client";

import { ProfileModal } from "@/components/profile-modal";
import { ROLE_LABELS } from "@/lib/role-permissions";
import {
  PARTICIPANT_CUSTOMERS_LABEL,
  SURVEY_LIST_LABEL,
} from "@/lib/ui-labels";
import { pillButtonClass } from "@/lib/pill-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [courseListHref, setCourseListHref] = useState("/dashboard");
  const [profileOpen, setProfileOpen] = useState(false);

  const presentationMatch = pathname.match(
    /^\/presentations\/([^/]+)\/(evaluate|observer-evaluate|professor-evaluate|prep)/
  );

  useEffect(() => {
    if (!presentationMatch) {
      setCourseListHref("/dashboard");
      return;
    }
    const presentationId = presentationMatch[1];
    fetch(`/api/presentations/${presentationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.courseId) {
          setCourseListHref(`/dashboard/courses/${data.courseId}`);
        } else {
          setCourseListHref("/dashboard");
        }
      })
      .catch(() => setCourseListHref("/dashboard"));
  }, [pathname, presentationMatch]);

  const listLabel = presentationMatch
    ? PARTICIPANT_CUSTOMERS_LABEL
    : SURVEY_LIST_LABEL;
  const listHref = presentationMatch ? courseListHref : "/dashboard";
  const onEvaluationListPage = pathname === "/dashboard";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          Preferance Eval
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
                title="개인정보 수정"
              >
                {session.user.name}
                {` (${ROLE_LABELS[session.user.role]})`}
              </button>
              {!onEvaluationListPage && (
                <Link href={listHref} className={pillButtonClass}>
                  {listLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={pillButtonClass}
              >
                로그아웃
              </button>
            </>
          ) : null}
        </nav>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
