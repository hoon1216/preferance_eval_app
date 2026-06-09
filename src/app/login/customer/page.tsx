"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username: name.trim(),
      password: "",
      loginRole: "OBSERVER",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        "등록된 고객 이름과 일치하지 않거나, 같은 이름이 여러 명입니다. 담당자에게 문의해주세요."
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-emerald-800">고객 접속</h1>
      <p className="mt-2 text-zinc-600">
        회원가입 없이 담당자가 등록한 <strong>이름</strong>만 입력하면 됩니다.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium">이름</label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="등록된 고객 이름"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "접속 중..." : "접속"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        담당자이신가요?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          담당자 로그인
        </Link>
      </p>
    </>
  );
}

export default function CustomerLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={<p className="text-zinc-500">불러오는 중...</p>}>
        <CustomerLoginForm />
      </Suspense>
    </div>
  );
}
