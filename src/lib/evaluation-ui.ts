export const ROW_MIN = "min-h-[3.5rem]";

/** 평가 과제 목록 | 평가 코멘트 = 6 : 4 */
export const EVALUATION_TABLE_SPLIT =
  "lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]";

export const EVALUATION_TABLE_MIN_WIDTH = "min-w-[800px]";

/** 표 셀 가로·세로 패딩 (동일 간격) */
const cellX = "px-2";
const headerY = "py-3";
const bodyY = "py-2";

/** # · 이름 · 학번 · 과제 · 발표자료 · 평가 */
export const LEFT_LIST_GRID =
  "grid-cols-[2.15rem_minmax(4.5rem,5.5rem)_3.85rem_minmax(11rem,2.5fr)_5.175rem_5.175rem]";

/** 표 안 pill 버튼 — 한글 약 5자 기준, 폭 10% 축소 */
export const tablePillButtonSize =
  "inline-flex h-7 w-[4.95rem] min-w-[4.95rem] max-w-[4.95rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-0 text-xs font-medium leading-none transition";

/** 교수용 코멘트 5열 (간격 축소) */
export const COMMENT_GRID_PROFESSOR =
  "grid grid-cols-5 gap-px";

/** 학생용 코멘트 4열 (간격 축소) */
export const COMMENT_GRID_STUDENT = "grid grid-cols-4 gap-px";

export function isAssignmentRegistered(p: {
  title: string | null;
  overview?: string | null;
}) {
  return Boolean(p.title?.trim() && p.overview?.trim());
}

export function pillClass(vivid: boolean, enabled: boolean) {
  const base = tablePillButtonSize;
  if (!enabled) {
    return `${base} pointer-events-none cursor-not-allowed opacity-[0.43] saturate-[0.55] grayscale-0`;
  }
  if (!vivid) {
    return `${base} cursor-pointer opacity-[0.63] saturate-[0.7] hover:opacity-[0.73]`;
  }
  return base;
}

export const pillGreenActive =
  "bg-emerald-600 text-white hover:bg-emerald-700";
export const pillBlueActive = "bg-blue-500 text-white hover:bg-blue-600";
export const pillNavyActive = "bg-blue-800 text-white hover:bg-blue-900";
export const pillGreyActive = "bg-zinc-500 text-white hover:bg-zinc-600";
export const pillVioletActive =
  "bg-violet-600 text-white hover:bg-violet-700";
export const pillGreenMuted = "bg-emerald-600/65 text-white/95";
export const pillBlueMuted = "bg-blue-500/65 text-white/95";
export const pillNavyMuted = "bg-blue-800/65 text-white/95";
export const pillGreyMuted = "bg-zinc-400/75 text-white/85";
export const pillVioletMuted = "bg-violet-400/75 text-white/85";

export const headerCell =
  `flex items-center justify-center border-b border-zinc-300 bg-zinc-50 ${cellX} ${headerY} text-center text-sm font-semibold`;

export const indexHeaderCell =
  `flex items-center justify-center border-b border-zinc-300 bg-zinc-50 ${cellX} ${headerY} text-center text-sm font-semibold`;

export const nameHeaderCell = `${headerCell} whitespace-nowrap`;

export const assignmentHeaderCell = `${headerCell} justify-start text-left`;

export const bodyCell =
  `flex items-center justify-center border-t border-zinc-200 ${cellX} ${bodyY} text-center text-sm`;

export const indexBodyCell =
  `flex min-h-full items-center justify-center border-t border-zinc-200 ${cellX} ${bodyY} text-center text-sm tabular-nums`;

export const nameBodyCell = `${bodyCell} min-w-0 truncate font-medium whitespace-nowrap`;

export const assignmentBodyCell = `${bodyCell} min-w-0 justify-start text-left`;

export const commentHeaderCell =
  `flex items-center justify-center border-b border-zinc-300 bg-zinc-50 ${cellX} ${headerY} text-center text-xs font-semibold`;

export const commentBodyCell =
  `flex items-center justify-center border-t border-zinc-200 ${cellX} ${bodyY} text-center text-sm`;

/** 점수 + 코멘트 버튼 (교수용, 동일 gap) */
export const commentBodyCellStacked = `${commentBodyCell} flex-col gap-2`;
