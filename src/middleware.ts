import { authConfig } from "@/auth.config";
import {
  canManageCourse,
  canObserverEvaluate,
  canPeerEvaluate,
  isLeadProfessor,
} from "@/lib/role-permissions";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user.role;
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard/courses/new") && !canManageCourse(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (/\/dashboard\/courses\/[^/]+\/edit/.test(path) && !canManageCourse(role)) {
    const courseId = path.split("/")[3];
    return NextResponse.redirect(
      new URL(`/dashboard/courses/${courseId}`, req.nextUrl.origin)
    );
  }

  if (/\/presentations\/[^/]+\/evaluate/.test(path) && !canPeerEvaluate(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (
    /\/presentations\/[^/]+\/observer-evaluate/.test(path) &&
    !canObserverEvaluate(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (
    /\/presentations\/[^/]+\/professor-evaluate/.test(path) &&
    !isLeadProfessor(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (/\/presentations\/[^/]+\/prep/.test(path) && !canPeerEvaluate(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/presentations/:path*"],
};
