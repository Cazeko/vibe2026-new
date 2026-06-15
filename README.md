# Fitly

초등임용 준비생을 위한 AI 학습 플래너입니다. Fitly는 기출 문제 풀이, 오답 복습, 키워드 반복 학습, 학습 통계, 시험일 역산 플랜을 한곳에 모아 매일 무엇을 얼마나 공부해야 하는지 보여줍니다.

![Fitly landing](assets/screenshots/랜딩.png)

## 주요 기능

- **대시보드**: 학습 진척도, 연속 학습, 정답률, 오늘의 학습 계획을 한 화면에서 확인
- **기출 분석**: KICE 공개 기출 기반 시험지, 영역별 출제 흐름, 토픽맵, 학습 로드맵 제공
- **풀이 트랙**: 서술형 기출 답안 작성 후 AI 모범답안과 비교하며 자가 채점
- **키워드 트랙**: 정의, 핵심 요소, 출제 이력을 중심으로 개념 카드 반복 학습
- **오답 트랙**: 다시 풀 문제와 어려웠던 문제를 자동으로 모아 재학습
- **SRS 복습 큐**: `ts-fsrs` 기반 spaced repetition으로 복습 시점 자동 계산
- **학습 계획**: 시험일까지 남은 일수를 기준으로 풀이, 키워드, 오답 복습량 자동 산정
- **학습 분석**: 학습 시간, 정답률, 약점 유형, 활동 히트맵 시각화
- **AI 팟캐스트**: 약점 주제를 2인 대화체 음성 학습 콘텐츠로 생성
- **PWA 지원**: 모바일 홈 화면 설치 및 오프라인 친화적 사용 흐름 지원

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI, lucide-react |
| Backend | Supabase Auth, Supabase Storage, PostgreSQL |
| ORM | Drizzle ORM, drizzle-kit |
| AI | Google Gemini API, Vision/OCR, Embedding, TTS |
| Scheduling | ts-fsrs |
| Chart | Recharts |
| Test | Vitest |
| Deploy | Vercel |

## 프로젝트 구조

```text
fitly/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # shared UI and feature components
│   ├── lib/                 # Supabase, DB, AI, SRS, dashboard logic
│   └── types/               # shared TypeScript types
├── drizzle/                 # Drizzle migration files
├── supabase/migrations/     # Supabase SQL migrations
├── scripts/seed/            # seed data and PDF page upload scripts
├── kice_pdfs/               # KICE public exam PDF seed assets
├── public/                  # PWA manifest, service worker, icons
└── assets/                  # screenshots, examples, presentation assets
```

## 시작하기

### 1. 저장소 클론 및 패키지 설치

```bash
git clone https://github.com/your-org/fitly.git
cd fitly
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 다음 값을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

GEMINI_API_KEY=
GEMINI_MODEL_PRO=gemini-2.5-pro
GEMINI_MODEL_FLASH=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USER_IDS=
```

> `.env`, `.env.local`에는 민감한 키가 포함되므로 GitHub에 커밋하지 않습니다.

### 3. 데이터베이스 마이그레이션

Supabase 프로젝트와 `DATABASE_URL`을 준비한 뒤 Drizzle 마이그레이션을 적용합니다.

```bash
npm run db:migrate
```

개발 중 스키마를 직접 동기화하려면 다음 명령을 사용할 수 있습니다.

```bash
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 시드 데이터

Fitly는 공개 기출 기반 학습 서비스를 전제로 합니다. `kice_pdfs/`에는 KICE 공개 기출 PDF를 배치하고, `scripts/seed/`의 스크립트로 DB와 Storage에 학습 데이터를 적재합니다.

```bash
node scripts/seed/load-db.mjs
node scripts/seed/upload-pages.mjs
npm run seed:demo
```

시드 파이프라인은 환경과 데이터 준비 상태에 따라 달라질 수 있으므로 실행 전 Supabase Storage bucket, service role key, DB 연결 정보를 확인하세요.

## 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | Next.js lint 실행 |
| `npm run test` | Vitest 테스트 실행 |
| `npm run db:generate` | Drizzle migration 생성 |
| `npm run db:migrate` | Drizzle migration 적용 |
| `npm run db:push` | 현재 schema를 DB에 push |
| `npm run db:studio` | Drizzle Studio 실행 |
| `npm run seed:demo` | 데모 사용자 시드 생성 |

## 핵심 화면

| 화면 | 설명 |
| --- | --- |
| 대시보드 | KPI, 학습 추이, 오늘의 플랜, 약점 유형, AI 추천 |
| 기출 분석 | 시험지 목록, 히트맵, 토픽맵, S/A/B/C 로드맵 |
| 풀이 | 서술형 답안 작성, AI 모범답안 비교, 자가 채점 |
| 학습 | 풀이, 키워드, 오답 3개 트랙의 SRS 복습 큐 |
| 팟캐스트 | 약점 주제 기반 2인 대화체 학습 콘텐츠 |
| 학습 계획 | 시험일까지 남은 일수 기준 일일 목표량 자동 계산 |
| 학습 분석 | 학습 시간, 정답률, 카드 수, 활동량 히트맵 |
| 마이 페이지 | 목표 지역, 시험일, 계정 학습 정보 관리 |

## 배포

Vercel 배포를 기준으로 구성되어 있습니다.

1. Vercel 프로젝트를 생성하고 GitHub 저장소를 연결합니다.
2. Supabase, Database, Gemini 관련 환경 변수를 Vercel Environment Variables에 등록합니다.
3. `npm run build`가 통과하는지 확인한 뒤 배포합니다.

`vercel.json`과 `next.config.mjs`가 포함되어 있으므로 기본 Next.js 배포 흐름을 그대로 사용할 수 있습니다.

## 데이터 및 저작권 안내

- 기출 PDF는 한국교육과정평가원(KICE)의 공식 공개 기출을 기준으로 사용합니다.
- 사설 교재, 학원 자료, 비공개 해설 자료를 무단으로 인덱싱하지 않는 것을 전제로 합니다.
- AI가 생성한 해설, 팟캐스트, 피드백은 학습 보조용이며 최종 정답이나 공식 해설을 대체하지 않습니다.

## 라이선스

현재 별도 라이선스 파일이 포함되어 있지 않습니다. 외부 공개 또는 협업 전 라이선스 정책을 먼저 확정하는 것을 권장합니다.
