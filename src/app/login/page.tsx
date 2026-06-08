"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_INITIAL_PASSWORD } from "@/lib/default-password";

type LoginRole = "PROFESSOR" | "OBSERVER";

const loginBoxClass =
  "flex h-full min-h-[22rem] flex-col rounded-2xl bg-white p-6 shadow-sm";

export default function LoginPage() {
  const router = useRouter();
  const [professorName, setProfessorName] = useState("");
  const [professorPassword, setProfessorPassword] = useState(DEFAULT_INITIAL_PASSWORD);
  const [observerName, setObserverName] = useState("");
  const [observerPassword, setObserverPassword] = useState(DEFAULT_INITIAL_PASSWORD);
  const [errorByRole, setErrorByRole] = useState<Record<LoginRole, string>>({
    PROFESSOR: "",
    OBSERVER: "",
  });
  const [loadingByRole, setLoadingByRole] = useState<Record<LoginRole, boolean>>({
    PROFESSOR: false,
    OBSERVER: false,
  });

  async function handleSubmit(
    e: React.FormEvent,
    role: LoginRole,
    username: string,
    password: string
  ) {
    e.preventDefault();
    setLoadingByRole((prev) => ({ ...prev, [role]: true }));
    setErrorByRole((prev) => ({ ...prev, [role]: "" }));

    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      loginRole: role,
      redirect: false,
    });

    setLoadingByRole((prev) => ({ ...prev, [role]: false }));

    if (result?.error) {
      setErrorByRole((prev) => ({
        ...prev,
        [role]:
          "선택한 역할(담당자·팀멤버)과 이름·비밀번호가 일치하지 않습니다. 초대 링크로 최초 설정을 완료했는지 확인해주세요.",
      }));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">관리자 로그인</h1>
      <p className="mt-2 text-zinc-600">
        담당자·팀멤버 전용입니다. 고객은{" "}
        <Link href="/login/customer" className="text-emerald-700 hover:underline">
          고객 접속 화면
        </Link>
        을 이용해주세요.
      </p>

      <div className="mt-8 space-y-3">
        <div className="grid gap-6 md:grid-cols-2 lg:items-stretch">
          <form
            onSubmit={(e) =>
              handleSubmit(e, "PROFESSOR", professorName, professorPassword)
            }
            className={`${loginBoxClass} border border-blue-200`}
          >
            <h2 className="text-xl font-semibold text-blue-700">담당자 로그인</h2>
            <p className="mt-1 text-sm text-zinc-500">조사 생성·편집·결과 관리</p>
            <div className="mt-6 flex flex-1 flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium">이름</label>
                <input
                  type="text"
                  required
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">비밀번호</label>
                <input
                  type="password"
                  required
                  value={professorPassword}
                  onChange={(e) => setProfessorPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </div>
              {errorByRole.PROFESSOR && (
                <p className="text-sm text-red-600">{errorByRole.PROFESSOR}</p>
              )}
              <button
                type="submit"
                disabled={loadingByRole.PROFESSOR}
                className="mt-auto w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingByRole.PROFESSOR ? "로그인 중..." : "담당자 로그인"}
              </button>
            </div>
          </form>

          <form
            onSubmit={(e) =>
              handleSubmit(e, "OBSERVER", observerName, observerPassword)
            }
            className={`${loginBoxClass} border border-violet-200`}
          >
            <h2 className="text-xl font-semibold text-violet-700">팀멤버 로그인</h2>
            <p className="mt-1 text-sm text-zinc-500">조사 결과 조회 (편집 불가)</p>
            <div className="mt-6 flex flex-1 flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium">이름</label>
                <input
                  type="text"
                  required
                  value={observerName}
                  onChange={(e) => setObserverName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">비밀번호</label>
                <input
                  type="password"
                  required
                  value={observerPassword}
                  onChange={(e) => setObserverPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </div>
              {errorByRole.OBSERVER && (
                <p className="text-sm text-red-600">{errorByRole.OBSERVER}</p>
              )}
              <button
                type="submit"
                disabled={loadingByRole.OBSERVER}
                className="mt-auto w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {loadingByRole.OBSERVER ? "로그인 중..." : "팀멤버 로그인"}
              </button>
            </div>
          </form>
        </div>
        <div>
          <Link href="/register" className="text-sm text-blue-600 hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
