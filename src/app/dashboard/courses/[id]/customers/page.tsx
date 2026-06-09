"use client";

import {
  CourseCustomerTable,
  type CustomerRow,
} from "@/components/course-customer-table";
import { CourseEditLayout } from "@/components/course-edit-layout";
import { GENDER_OPTIONS } from "@/lib/gender-labels";
import { SURVEY_CUSTOMER_MANAGE_SECTION_LABEL } from "@/lib/ui-labels";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { useProfessorCourseGuard } from "@/lib/use-professor-course-guard";
import type { Gender } from "@prisma/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function CourseCustomersPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { loading: guardLoading } = useProfessorCourseGuard(courseId);
  const [courseName, setCourseName] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerGender, setCustomerGender] = useState<Gender | "">("");
  const [customerAge, setCustomerAge] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [courseRes, customersRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/observers`),
    ]);

    if (courseRes.ok) {
      const json = await courseRes.json();
      setCourseName(json.course.name ?? "");
    }
    if (customersRes.ok) {
      const list = await customersRes.json();
      setCustomers(
        list.map((o: CustomerRow) => ({
          id: o.id,
          name: o.name,
          gender: o.gender,
          age: o.age,
        }))
      );
    }
  }, [courseId]);

  useEffect(() => {
    if (!guardLoading) load();
  }, [load, guardLoading]);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/courses/${courseId}/observers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customerName,
        gender: customerGender,
        age: customerAge,
      }),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "고객 등록 실패");
      return;
    }
    setCustomerName("");
    setCustomerGender("");
    setCustomerAge("");
    load();
  }

  async function updateCustomer(
    customerId: string,
    data: { name: string; gender: Gender; age: number }
  ) {
    setError("");
    const res = await fetch(`/api/courses/${courseId}/observers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "수정 실패");
      return false;
    }
    load();
    return true;
  }

  async function deleteCustomer(customerId: string) {
    if (!window.confirm("이 참여 고객을 목록에서 삭제할까요?")) return;
    setError("");
    const res = await fetch(`/api/courses/${courseId}/observers/${customerId}`, {
      method: "DELETE",
    });
    const json = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(json?.error ?? "삭제 실패");
      return;
    }
    load();
  }

  if (guardLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-10">불러오는 중...</div>;
  }

  return (
    <CourseEditLayout
      courseId={courseId}
      title={SURVEY_CUSTOMER_MANAGE_SECTION_LABEL}
      courseName={courseName}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">
          참여 고객은{" "}
          <Link href="/login/customer" className="text-emerald-700 hover:underline">
            고객 접속 화면
          </Link>
          에서 등록된 이름만 입력해 접속합니다.
        </p>
        <form
          onSubmit={addCustomer}
          className="mb-4 flex flex-wrap items-end gap-2"
        >
          <div className="min-w-[160px] flex-1">
            <label className="text-sm font-medium">이름</label>
            <input
              placeholder="참여 고객 이름"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="text-sm font-medium">성별</label>
            <select
              required
              value={customerGender}
              onChange={(e) =>
                setCustomerGender(e.target.value as Gender | "")
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[100px]">
            <label className="text-sm font-medium">연령</label>
            <input
              type="number"
              min={1}
              max={120}
              required
              placeholder="세"
              value={customerAge}
              onChange={(e) => setCustomerAge(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            고객 추가
          </button>
        </form>
        <CourseCustomerTable
          rows={customers}
          onUpdate={updateCustomer}
          onDelete={deleteCustomer}
        />
      </section>
    </CourseEditLayout>
  );
}
