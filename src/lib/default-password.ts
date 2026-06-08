import bcrypt from "bcryptjs";

export const DEFAULT_INITIAL_PASSWORD = "123456";

export async function hashInitialPassword() {
  return bcrypt.hash(DEFAULT_INITIAL_PASSWORD, 10);
}

export function displayOrUnregistered(value: string | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "미등록";
  }
  return value;
}
