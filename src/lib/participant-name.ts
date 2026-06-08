/** 등록·접속 시 이름 비교용 (유니코드·공백·대소문자 정리) */
export function normalizeParticipantName(name: string) {
  return name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ko-KR");
}
