"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { DEFAULT_INITIAL_PASSWORD } from "@/lib/default-password";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { useEffect, useState } from "react";

type JoinInfo =
  | {
      type: "COURSE";
      courseName: string;
      courseSemester: string;
    }
  | {
      type: "STUDENT" | "OBSERVER";
      name: string;
      courseName: string;
      courseSemester: string;
      profileComplete: boolean;
    };

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [nameLookupLoading, setNameLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    department: "",
    email: "",
    password: DEFAULT_INITIAL_PASSWORD,
    passwordConfirm: DEFAULT_INITIAL_PASSWORD,
  });

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/join/${token}`);
      const data = await parseJsonResponse<
        JoinInfo & { error?: string; profileComplete?: boolean }
      >(res);
      if (!res.ok || !data) {
        setError(data?.error ?? "접속 링크를 확인할 수 없습니다.");
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      setInfo(data as JoinInfo);
      if (data.type !== "COURSE" && data.profileComplete) {
        setError("이미 계정 설정이 완료되었습니다. 로그인해주세요.");
      }
    })();
  }, [token]);

  async function lookupName(e: React.FormEvent) {
    e.preventDefault();
    const name = participantName.trim().replace(/\s+/g, " ");
    if (!name) {
      setError("이름을 입력해주세요.");
      return;
    }

    setNameLookupLoading(true);
    setError("");

    const res = await fetch(
      `/api/join/${token}?name=${encodeURIComponent(name)}`
    );
    const data = await parseJsonResponse<
      JoinInfo & { error?: string; profileComplete?: boolean }
    >(res);
    setNameLookupLoading(false);

    if (!res.ok || !data) {
      setError(data?.error ?? "이름을 확인할 수 없습니다.");
      return;
    }

    setInfo(data as JoinInfo);
    if (data.profileComplete) {
      setError("이미 계정 설정이 완료되었습니다. 로그인해주세요.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!info || info.type === "COURSE" || info.profileComplete) return;

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/join/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registeredName: info.name,
        studentId: info.type === "STUDENT" ? form.studentId : undefined,
        department: info.type === "OBSERVER" ? form.department : undefined,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await parseJsonResponse<{
      ok?: boolean;
      role?: string;
      name?: string;
      error?: string;
    }>(res);

    if (!res.ok || !data?.ok || !data.name) {
      setLoading(false);
      setError(
        data?.error ??
          (res.ok
            ? "설정은 완료되었으나 응답을 확인하지 못했습니다. 로그인 화면에서 다시 시도해 주세요."
            : "설정에 실패했습니다.")
      );
      return;
    }

    const result = await signIn("credentials", {
      username: data.name,
      password: form.password,
      loginRole: data.role === "OBSERVER_PROFESSOR" ? "OBSERVER" : "STUDENT",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!info && !error) {
    return <div className="mx-auto max-w-md px-4 py-12">링크 확인 중...</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">최초 접속 설정</h1>
      <p className="mt-2 text-sm text-zinc-600">
        초기 비밀번호는 {DEFAULT_INITIAL_PASSWORD}입니다. 필요 시 아래에서 변경할 수
        있습니다.
      </p>

      {info?.type === "COURSE" && (
        <>
          <p className="mt-2 text-zinc-600">
            {info.courseName} · {info.courseSemester}
          </p>
          <form onSubmit={lookupName} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium">등록된 이름</label>
              <input
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="평가에 등록된 이름"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={nameLookupLoading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {nameLookupLoading ? "확인 중..." : "이름 확인"}
            </button>
          </form>
        </>
      )}

      {info && info.type !== "COURSE" && (
        <>
          <p className="mt-2 text-zinc-600">
            {info.courseName} · {info.courseSemester}
          </p>
          <p className="mt-1 text-sm">
            {info.type === "STUDENT" ? "학생" : "참관교수"}:{" "}
            <span className="font-semibold">{info.name}</span>
          </p>
        </>
      )}

      {info && info.type !== "COURSE" && !info.profileComplete ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {info.type === "STUDENT" && (
            <div>
              <label className="block text-sm font-medium">학번</label>
              <input
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
          )}
          {info.type === "OBSERVER" && (
            <div>
              <label className="block text-sm font-medium">학과</label>
              <input
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">이메일</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">비밀번호 확인</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.passwordConfirm}
              onChange={(e) =>
                setForm({ ...form, passwordConfirm: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "저장 중..." : "설정 완료 및 로그인"}
          </button>
        </form>
      ) : info && info.type !== "COURSE" ? (
        <div className="mt-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
            로그인 화면으로
          </Link>
        </div>
      ) : null}
    </div>
  );
}
