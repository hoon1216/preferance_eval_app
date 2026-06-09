"use client";

import { GENDER_OPTIONS, formatGender } from "@/lib/gender-labels";
import type { Gender } from "@prisma/client";
import { useState } from "react";

export type CustomerRow = {
  id: string;
  name: string;
  gender: Gender | null;
  age: number | null;
};

const actionButtonClass =
  "rounded border px-2 py-0.5 text-xs hover:bg-zinc-50";

export function CourseCustomerTable({
  rows,
  onDelete,
  onUpdate,
}: {
  rows: CustomerRow[];
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    data: { name: string; gender: Gender; age: number }
  ) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<Gender | "">("");
  const [editAge, setEditAge] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(row: CustomerRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditGender(row.gender ?? "");
    setEditAge(row.age != null ? String(row.age) : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditGender("");
    setEditAge("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editGender || !editAge) return;
    setSaving(true);
    const ok = await onUpdate(id, {
      name: editName.trim(),
      gender: editGender,
      age: Number(editAge),
    });
    setSaving(false);
    if (ok) cancelEdit();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="w-12 px-4 py-3">순번</th>
            <th className="px-4 py-3">이름</th>
            <th className="w-20 px-4 py-3">성별</th>
            <th className="w-20 px-4 py-3">연령</th>
            <th className="w-28 px-4 py-3">관리</th>
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
            rows.map((row, index) => {
              const isEditing = editingId === row.id;

              return (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full min-w-[120px] rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="font-medium">{row.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editGender}
                        onChange={(e) =>
                          setEditGender(e.target.value as Gender | "")
                        }
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                      >
                        <option value="">선택</option>
                        {GENDER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      formatGender(row.gender)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      row.age != null ? `${row.age}세` : "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => saveEdit(row.id)}
                          className={`${actionButtonClass} border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50`}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancelEdit}
                          className={`${actionButtonClass} border-zinc-300 text-zinc-700`}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className={`${actionButtonClass} border-zinc-300 text-zinc-700`}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className={`${actionButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
