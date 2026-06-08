"use client";

import type { Role } from "@/lib/role-permissions";
import { ROLE_LABELS } from "@/lib/role-permissions";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type ProfileData = {
  name: string;
  email: string | null;
  studentId: string | null;
  role: Role;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProfileModal({ open, onClose }: Props) {
  const { update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;

    setLoadError("");
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");

    (async () => {
      const res = await fetch("/api/profile");
      const data = await parseJsonResponse<ProfileData & { error?: string }>(res);
      if (!res.ok || !data) {
        setLoadError(data?.error ?? "개인정보를 불러오지 못했습니다.");
        setProfile(null);
        return;
      }
      setProfile(data);
      setEmail(data.email ?? "");
      setStudentId(data.studentId ?? "");
    })();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (newPassword && newPassword !== newPasswordConfirm) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const payload: Record<string, string> = {
      email,
    };

    if (profile.role === "STUDENT") {
      payload.studentId = studentId;
    }

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
      payload.newPasswordConfirm = newPasswordConfirm;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonResponse<ProfileData & { error?: string }>(res);
    setLoading(false);

    if (!res.ok || !data) {
      setError(data?.error ?? "저장에 실패했습니다.");
      return;
    }

    setProfile(data);
    setEmail(data.email ?? "");
    setStudentId(data.studentId ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setSuccess("개인정보가 저장되었습니다.");

    await update({
      user: {
        email: data.email,
        studentId: data.studentId,
      },
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">개인정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800"
          >
            닫기
          </button>
        </div>

        {loadError ? (
          <p className="mt-4 text-sm text-red-600">{loadError}</p>
        ) : !profile ? (
          <p className="mt-4 text-sm text-zinc-500">불러오는 중...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">이름</label>
              <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {profile.name}
                <span className="ml-2 text-zinc-500">
                  ({ROLE_LABELS[profile.role]})
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">이름은 변경할 수 없습니다.</p>
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium">
                이메일
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="example@school.ac.kr"
              />
            </div>

            {profile.role === "STUDENT" && (
              <div>
                <label htmlFor="profile-student-id" className="block text-sm font-medium">
                  학번
                </label>
                <input
                  id="profile-student-id"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="border-t border-zinc-200 pt-4">
              <p className="text-sm font-medium text-zinc-800">비밀번호 변경</p>
              <p className="mt-1 text-xs text-zinc-500">
                변경하지 않으려면 비워 두세요.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    htmlFor="profile-current-password"
                    className="block text-sm font-medium"
                  >
                    현재 비밀번호
                  </label>
                  <input
                    id="profile-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label htmlFor="profile-new-password" className="block text-sm font-medium">
                    새 비밀번호
                  </label>
                  <input
                    id="profile-new-password"
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-new-password-confirm"
                    className="block text-sm font-medium"
                  >
                    새 비밀번호 확인
                  </label>
                  <input
                    id="profile-new-password-confirm"
                    type="password"
                    minLength={6}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
