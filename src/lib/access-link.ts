export function getAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function buildJoinUrl(token: string) {
  return `${getAppOrigin()}/join/${token}`;
}
