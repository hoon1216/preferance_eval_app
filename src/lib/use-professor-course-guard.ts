"use client";

import { canManageCourse } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function useProfessorCourseGuard(courseId: string) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isProfessor =
    status === "authenticated" && canManageCourse(session?.user?.role ?? "");

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!canManageCourse(session?.user?.role ?? "")) {
      router.replace(`/dashboard/courses/${courseId}`);
    }
  }, [status, session?.user?.role, router, courseId]);

  return {
    session,
    status,
    isProfessor,
    loading:
      status === "loading" ||
      (status === "authenticated" && !canManageCourse(session?.user?.role ?? "")),
  };
}
