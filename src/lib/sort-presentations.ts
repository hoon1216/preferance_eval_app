/** 평가 과제 목록 — 발표자 이름 가나다순(ㄱ~ㅎ) */
export function sortPresentationsByPresenterName<
  T extends { presenter: { name: string } },
>(presentations: T[]): T[] {
  return [...presentations].sort((a, b) =>
    a.presenter.name.localeCompare(b.presenter.name, "ko")
  );
}

/** 질문 문항 목록 — orderIndex 순 */
export function sortPresentationsByOrderIndex<
  T extends { orderIndex?: number; title?: string | null },
>(presentations: T[]): T[] {
  return [...presentations].sort(
    (a, b) =>
      (a.orderIndex ?? 0) - (b.orderIndex ?? 0) ||
      (a.title ?? "").localeCompare(b.title ?? "", "ko")
  );
}
