"use client";

import { formatGender } from "@/lib/gender-labels";
import type { Gender } from "@prisma/client";

export type CustomerRow = {
  id: string;
  name: string;
  gender: Gender | null;
  age: number | null;
};

export function CourseCustomerTable({
  rows,
  onDelete,
}: {
  rows: CustomerRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="w-12 px-4 py-3">순번</th>
            <th className="px-4 py-3">이름</th>
            <th className="w-20 px-4 py-3">성별</th>
            <th className="w-20 px-4 py-3">연령</th>
            <th className="w-20 px-4 py-3">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                등록된 참여 고객이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className="border-b border-zinc-100">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{formatGender(row.gender)}</td>
                <td className="px-4 py-3">
                  {row.age != null ? `${row.age}세` : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
