/** 평가 과제 목록 — 발표자 이름 가나다순(ㄱ~ㅎ) */
export function sortPresentationsByPresenterName<
  T extends { presenter: { name: string } },
>(presentations: T[]): T[] {
  return [...presentations].sort((a, b) =>
    a.presenter.name.localeCompare(b.presenter.name, "ko")
  );
}
