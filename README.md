# Preferance Eval App

**일반 고객 선호도 평가** 웹 앱입니다.  
고객·제품·서비스에 대한 선호도 평가와 피드백 수집을 목적으로 추가 개발합니다.

## 현재 포함된 기능 (peer-eval-app 기반)

| 영역 | 설명 |
|------|------|
| **평가 세션** | 관리자가 조사 생성, 참여자·팀 맴버 등록 |
| **과제/자료** | 참여자가 제목·개요·PDF 제출 |
| **선호도 평가** | 완성도(10점, 0.5 단위) + 평가 의견 1개 |
| **결과·PDF** | 점수 집계, 코멘트 모달, 피드백 PDF |

## 로컬 실행

```bash
cd preferance_eval_app
cp .env.example .env
# .env 에 DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL 설정

npm install
npm run db:push
npm run db:seed
npm run dev
```

브라우저: http://localhost:3000

### 데모 계정 (seed 후)

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 교수 | prof@example.com | professor123 |
| 학생 | student1@example.com | student123 |

## Vercel 배포 시 환경 변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL URL |
| `AUTH_SECRET` | NextAuth 비밀키 |
| `NEXTAUTH_URL` | 배포 URL (예: `https://xxx.vercel.app`) |
| `BLOB_STORE_ID` | Vercel Blob (PDF 업로드) |
| `BLOB_READ_WRITE_TOKEN` | 4MB 초과 PDF 업로드 시 필요 |

## 원본 프로젝트

- 원본: `peer-eval-app` (대학 발표 피어 평가)
- 이 프로젝트: `preferance_eval_app` (고객 선호도 평가용 파생)

## 다음 개발 방향 (예시)

- 용어 변경: 강의 → 평가 세션, 학생 → 패널/고객 등
- 선호도 전용 평가 항목·척도
- 제품/서비스 비교 평가 UI
