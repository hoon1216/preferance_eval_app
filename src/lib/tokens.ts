import { randomUUID } from "crypto";

export function newAccessToken() {
  return randomUUID();
}
