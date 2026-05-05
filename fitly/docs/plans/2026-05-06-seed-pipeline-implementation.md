# 시드 파이프라인 구현 계획

| 항목 | 값 |
|------|----|
| 일자 | 2026-05-06 |
| 헌법 버전 | **v3.1** (제18조 모델 매트릭스 기능별 차등 + 부칙 제3조 1·2항 정합) |
| 선행 문서 | `docs/plans/2026-05-06-fitly-v3-임용-design.md` |
| 적용 대상 | `fitly/kice_pdfs/` (68개 PDF) → DB 시드 (exam_papers, exam_items, cards) |
| 추정 일정 | DB 마이그레이션 0.5일 + 파이프라인 구현 2일 + 시드 실행·검토 3~4일 = **약 1주** |
| **단기 시드 모델** (헌법 제18조 v3.1 B-단기) | **`claude-sonnet-4-6` (1M ctx)** + Anthropic prompt caching |
| **장기 갱신 모델** (B-장기, 매년) | Gemini 매트릭스 (Pro = 분리·모범답안 / Flash = 태깅·키워드) |
| 단기 시드 비용 추정 | **약 $50~70** (caching 적용) — 안전 마진 1.7배 시 $85~120 |
| 장기 매년 갱신 비용 | $1~3/년 (Flash 가성비 활용) |

---

## 1. 현 상태 / 마이그레이션 대상

### 1.1 기존 자산 (재활용)

| 자산 | 위치 | 비고 |
|------|------|------|
| Gemini 클라이언트 | `src/lib/ai/gemini.ts` | `GEMINI_MODELS.pro/flash/embedding` 그대로 |
| PDF 텍스트 추출 | `src/lib/ocr/pdf.ts` | `unpdf` 기반 — 텍스트 PDF용 |
| 이미지 OCR | `src/lib/ocr/vision.ts` | Gemini Vision — 스캔/이미지 PDF 폴백 (장기) |
| 환경 변수 | `.env.example` | `GEMINI_API_KEY`, `GEMINI_MODEL_PRO`, `GEMINI_MODEL_FLASH` 등 |

### 1.1A 신설 (헌법 v3.1 제18조 B-단기)

| 자산 | 위치 | 비고 |
|------|------|------|
| Anthropic 클라이언트 | `src/lib/ai/anthropic.ts` (신설) | Sonnet 4.6 1M, prompt caching 활용 |
| Anthropic SDK | `@anthropic-ai/sdk` (npm 추가, D-S1.5에서) | TypeScript SDK |
| 환경 변수 | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL_SONNET` | `.env.example` 갱신 |

### 1.2 폐기 대상 (v3.0 / v3.0.1 마이그레이션)

| 폐기 | 사유 |
|------|------|
| `study_cards` 테이블 | 헌법 제13조의2 v3.0 — `cards` 다형 테이블로 통합 |
| `vocab_cards` 테이블 | 동일 |
| `vocab-seed.ts` (편입 빈출 어휘) | 컨셉 피벗 — 임용 시드로 대체 |
| `universities` 테이블 | 헌법 제15조 v3.0 — 학교 → 지역 교육청 라벨 (선택 입력) |
| `materials` 테이블 | **v3.0.1 — 사용자 PDF 업로드 cut (헌법 제14조 5항)** |
| `/materials` 라우트, `/api/materials/*` | 동일 |
| `src/lib/ocr/study-cards.ts`, `src/lib/ocr/mistake-cards.ts` | 동일 |

### 1.3 신설 (Phase 0 — DB 마이그레이션)

| 신설 테이블 | 정의 |
|-----------|------|
| `exam_papers` | 시드 시험지 메타 (year, session, pdf_url, verified) |
| `exam_items` | 시드 문항 (paper_id FK, item_no, stem_md, format, domains[], bloom, keywords[], answer_key_md, verified) |
| `cards` | 다형 카드 (type='quiz'\|'keyword'\|'mistake', source_item_id FK 옵션, user_id 옵션) |
| `user_card_log` | 사용자별 FSRS 등급·복습 로그 |
| `user_attempts` | 사용자 답안 (item_id, answer_md, self_grade) |
| `podcast_episodes` | 팟캐스트 (scope, theme, script_json, audio_url, verified) |
| `podcast_progress` | 청취 진척 (user_id, episode_id, current_sec) |
| `regions` (선택) | 지역 교육청 17개 라벨 (정적 시드, 헌법 제15조) |

---

## 2. 의존 그래프

```
[Phase 0] DB 스키마 마이그레이션
   ├─ schema 파일 9개 작성/수정
   ├─ drizzle generate + push
   └─ 기존 vocab/study_cards 데이터 폐기 (개발 환경 한정)
        ↓
[Phase 1] 시드 파이프라인 (scripts/seed/*)
   ├─ 01 normalize-papers       (메타 정규화)
   ├─ 02 extract-text           (PDF → 텍스트)
   ├─ 03 split-items            (Gemini로 문항 분리)
   ├─ 04a tag-quiz              (서술형만, 2014~2026, 영역/Bloom/형식/키워드/모범답안)
   ├─ 04b tag-keywords          (전 기간, 키워드만)
   ├─ 05 review (UI)            (운영자 검토 — 별도 라우트)
   └─ 06 derive-cards           (exam_items → cards)
        ↓
[Phase 2] 검증
   ├─ 시드 데이터 sanity (문항 수·연도 분포·verified 비율)
   ├─ src/lib/progress/score.ts 갱신 + 단위 테스트 (풀이 0.5 + 키워드 0.2 + 일관성 0.3)
   └─ npm run build (헌법 제24조·제24조의3)
```

---

## 3. Phase 0 — DB 스키마 마이그레이션

### 3.1 신설 schema 파일

```
src/lib/db/schema/
  exam-papers.ts         (신설)
  exam-items.ts          (신설)
  cards.ts               (신설 — 다형 단일 테이블)
  user-card-log.ts       (신설)
  user-attempts.ts       (신설)
  podcast-episodes.ts    (신설)
  podcast-progress.ts    (신설)
  regions.ts             (신설, 정적 17개)
  index.ts               (수정 — 신설 export 추가, vocab/study-cards/universities export 제거)
```

### 3.2 컬럼 명세 (요점)

```ts
// exam_papers
{ id uuid PK, year int, session enum('논술','A','B'),
  pdf_url text, source_url text, verified bool default false,
  created_at, updated_at }

// exam_items
{ id uuid PK, paper_id uuid FK exam_papers,
  item_no int, stem_md text, points int,
  format enum('객관식','단답형','서술형','논술형'),
  domains jsonb<string[]>,                   // 11과목 + 교육학
  bloom enum('기억','이해','적용','분석','평가','창작'),
  keywords jsonb<string[]>,
  answer_key_md text nullable,
  verified bool default false,
  created_at, updated_at }

// cards (다형 단일 테이블)
{ id uuid PK,
  type enum('quiz','keyword','mistake'),
  source_item_id uuid FK exam_items ON DELETE CASCADE nullable,
  user_id uuid nullable,                     // shared seed면 NULL
  front_md text, back_md text,
  created_at,
  UNIQUE(source_item_id, type, user_id)      // 시드 재실행 시 중복 차단 (Appendix A #3)
}
INDEX cards_user_type_idx ON cards(user_id, type);

// user_card_state — FSRS 최신 상태 (1 row per user × card, 즉시 조회용)
{ id uuid PK, user_id uuid NOT NULL, card_id uuid FK ON DELETE CASCADE NOT NULL,
  fsrs_state jsonb NOT NULL,
  due_at timestamptz NOT NULL, last_reviewed_at timestamptz,
  UNIQUE(user_id, card_id) }
INDEX user_card_state_user_due_idx ON user_card_state(user_id, due_at);

// user_card_log — 등급 이력 (append-only)
{ id uuid PK, user_id uuid NOT NULL, card_id uuid FK NOT NULL,
  grade enum('again','hard','good','easy'),
  reviewed_at NOT NULL DEFAULT now() }
INDEX user_card_log_user_card_time_idx ON user_card_log(user_id, card_id, reviewed_at);

// user_attempts
{ id uuid PK, user_id uuid, item_id uuid FK,
  answer_md text, self_grade enum,
  attempted_at }

// podcast_episodes
{ id uuid PK, scope enum('shared','user'), user_id uuid nullable,
  theme text, script_json jsonb, audio_url text,
  duration_sec int, verified bool default false,
  generated_at }

// podcast_progress
{ id uuid PK, user_id, episode_id FK, current_sec int, completed_at nullable }
```

### 3.3 마이그레이션 단계

1. schema 파일 작성 (위 8개 + index.ts 정리)
2. `npm run db:generate` — drizzle 마이그레이션 생성
3. SQL 검토 (생성된 `drizzle/*.sql` 확인, 외래키·인덱스 sanity)
4. `npm run db:push` (Supabase에 적용)
5. 기존 `vocab_cards`/`study_cards`/`mistakes`/`universities` 테이블 drop (마이그레이션 SQL에 포함)
6. **검증**: `npm run build` 통과 + `src/lib/db/queries/*` 임포트 에러 0

### 3.4 주의 (헌법 정합)

- 제24조 — 스키마 변경이므로 **`npm run build` 의무**
- 제20조 — 모든 수정 전 Read 먼저
- 제28조 — 사용자 데이터 테이블(`user_card_log`, `user_attempts` 등)은 모든 쿼리에 `user_id` 일치 강제
- 제13조의2 7항 — `vocab_cards`/`study_cards` 폐지는 v3.0 컨셉 피벗에 따른 통합 마이그레이션

---

## 4. Phase 1 — 시드 파이프라인 (`scripts/seed/`)

### 4.0 Step별 모델 매핑 (헌법 v3.1 제18조 B-트랙)

| Step | 단기 (현 시점) | 장기 (매년) | prompt caching |
|------|---------------|-----------|----------------|
| 02 PDF → 텍스트 (unpdf) | unpdf | unpdf | — |
| 02b Vision OCR 폴백 | (보류 — 운영자 수동 입력 우선) | `gemini-3.1-pro-preview` | — |
| 03 문항 분리 | `claude-sonnet-4-6` (1M) | `gemini-3.1-pro-preview` | ✅ few-shot |
| 04a 풀이 태깅 + 모범답안 | `claude-sonnet-4-6` | `gemini-3.1-pro-preview` (모범답안) + `gemini-2.5-flash` (태깅) | ✅ |
| 04b 키워드 태깅 | `claude-sonnet-4-6` | **`gemini-2.5-flash`** | ✅ |
| 04b dedup 통합 | `claude-sonnet-4-6` | `gemini-3.1-pro-preview` (의미 충돌 해소 추론) | — |

> 단기 본실행은 Anthropic SDK + Sonnet 4.6 1M context로. Anthropic prompt caching (5분 TTL)을 활용하여 few-shot 컨텍스트 재사용 시 입력 비용 50~70% 절감.
>
> 장기 매년 갱신은 Gemini 매트릭스로 자동화 — D-S6a 비용·품질 dry-run 통과 후 본실행.

### 4.1 디렉토리 구조

```
scripts/seed/
  01-normalize-papers.ts        (메타 정규화)
  02-extract-text.ts            (PDF → 텍스트)
  03-split-items.ts             (문항 분리)
  04a-tag-quiz.ts               (서술형 태깅 + 모범답안)
  04b-tag-keywords.ts           (전 기간 키워드)
  06-derive-cards.ts            (cards 파생)
  data/                         (중간 산출물)
    papers.json                 (Step 1 출력)
    papers/{year}-{session}/
      raw.txt                   (Step 2 출력)
      items.json                (Step 3 출력)
      tagged.json               (Step 4 출력)
  lib/
    file-name-parser.ts         (파일명 → year/session)
    gemini-prompts.ts           (Gemini 프롬프트 템플릿)
    keyword-dedup.ts            (키워드 dedup·통합)
    cli.ts                      (공통 CLI 유틸 — dry-run, range 옵션)

src/app/admin/seed-review/      (Step 5 — 검토 UI, Phase 1 끝부분)
```

> Step 5(검토 UI)는 코드가 아니라 별도 페이지라 위 6개 스크립트와 분리.

### 4.2 Step 01 — 메타 정규화

**입력**: `kice_pdfs/*.pdf` (68개)
**출력**: `scripts/seed/data/papers.json`

```json
[
  { "id": "2024-논술", "year": 2024, "session": "논술",
    "pdf_path": "fitly/kice_pdfs/2024학년도_초등학교_교직논술.pdf",
    "status": "pending" },
  { "id": "2024-A", ...},
  ...
]
```

**로직**:
- 정규식 패턴 매칭으로 파일명 → `{year, session}` 추출
- 패턴 다양성 처리: `2024학년도_..._교직논술.pdf`, `2017학년도 초등학교 교육과정_A.pdf`, `01초등학교교육과정문제지.pdf`(=2001) 등
- **제외 대상** (헌법 정합):
  - 정답표 PDF (`*정답*.pdf`) — 사용자 결정 정합
  - "초등2차" 시리즈 — 1차 시험만 다룸
  - 2009/2010 통합본 — 별도 처리(스킵 또는 수동 분리, 우선 스킵)
- 추출 실패 PDF는 별도 `unparsed.json`으로 분류 (운영자 수동 처리 큐)

**검증**:
- 출력 JSON 길이 ≥ 50 (목표 ~54건: 23년치 × 3교시 - 누락)
- `year` ∈ [2002, 2026], `session` ∈ {'논술', 'A', 'B'}
- 단위 테스트: `file-name-parser.ts` (5~10개 케이스)

### 4.3 Step 02 — PDF → 텍스트

**입력**: `papers.json`
**출력**: `scripts/seed/data/papers/{year}-{session}/raw.txt`

**로직**:
- `unpdf`(제18조 4항)로 텍스트 추출 시도
- 텍스트 길이 < 500자(스캔 PDF 추정)면 Gemini Vision OCR 폴백
  - PDF → 페이지별 PNG 렌더링 (별도 라이브러리 필요 — `pdf-to-img` 또는 `pdfjs-dist` 활용)
  - 페이지별 `extractImageText()` 호출
- 출력 형식: 페이지 구분자(`\f`)로 분리된 plain text

**검증**:
- 각 raw.txt 길이 sanity (≥ 1KB)
- 추출 실패 시 `papers.json[i].status = 'extract_failed'` 마킹
- 단위 테스트는 어렵 (외부 호출) — 실제 PDF 1~2개로 통합 테스트

### 4.4 Step 03 — 문항 분리

**입력**: `raw.txt` + `papers.json`
**출력**: `items.json`

```json
[
  { "item_no": 1, "stem_md": "다음 ~ 서술하시오. ...",
    "points": 4, "format_hint": "서술형" },
  ...
]
```

**Gemini 프롬프트 설계** (`lib/gemini-prompts.ts`):

```
당신은 한국 초등교사 임용시험 문제지 분석 전문가입니다.
다음 시험지 텍스트에서 개별 문항을 분리해 JSON 배열로 반환하세요.

규칙:
- item_no: 문제 번호 (정수)
- stem_md: 문제 본문 (Markdown, 단락·표·번호 보존)
- points: 배점 (정수, 미표시 시 null)
- format_hint: '단답형' | '서술형' | '논술형' | '객관식' (제시 형식 추정)

JSON 외 텍스트는 출력하지 마세요.

[입력 텍스트]
...
```

**검증**:
- 논술: 문항 수 == 1
- 교육과정 A·B: 문항 수가 시험지 명세와 일치 (대부분 22문항)
- 미스매치 시 `items.json` 옆에 `validation.json`에 사유 기록 (운영자 검토용)

### 4.5 Step 04a — 풀이 시드 (서술형 태깅 + 모범답안)

**대상**: `papers.status='ok'` AND `year >= 2014` AND `session != '객관식 시대'`
**입력**: `items.json`
**출력**: `tagged.json` (풀이용)

```json
[
  { "item_no": 1, "stem_md": "...", "points": 4,
    "format": "서술형",
    "domains": ["국어", "교육학"],
    "bloom": "적용",
    "keywords": ["#2022개정 교육과정", "#피아제 인지발달", "#발문기법"],
    "answer_key_md": "## 모범답안\n\n...",
    "verified": false },
  ...
]
```

**Gemini 프롬프트** (`tag-quiz.ts`):

```
당신은 한국 초등교사 임용시험 분석 전문가입니다.
다음 문항을 분석하여 다음 4가지를 JSON으로 반환하세요.

1. domains: 다음 12개 영역 중 해당하는 항목들 배열
   국어, 수학, 사회, 과학, 영어, 도덕, 실과, 체육, 음악, 미술, 통합교과, 교육학
2. bloom: Bloom 인지수준 (기억|이해|적용|분석|평가|창작 중 1)
3. keywords: 핵심 키워드 3~5개 (한국어, 명사구)
4. answer_key_md: 모범답안 (Markdown, 4~8문단)

문항: ${stem_md}
배점: ${points}

답안 작성 시 주의:
- 본문에 근거한 추론만 작성
- 외부 학원·교재 해설 직접 인용 금지 (헌법 제27조·제30조)
- "검증 필요" 라벨이 노출됨을 전제로 작성
```

**검증**:
- domains는 12개 enum 안에 포함
- bloom은 6개 enum 안
- answer_key_md 길이 ≥ 200자
- 실패 시 `verified=false`로 시드, 검토 큐 진입

### 4.6 Step 04b — 키워드 시드 (전 기간)

**대상**: `papers.status='ok'` (2002~2026 전 기간)
**입력**: `items.json`
**출력**: `tagged.json`(키워드 전용 영역)

**로직**:
- 각 문항 → 키워드 3~5개 (Gemini 단일 호출)
- 전체 수집 후 `keyword-dedup.ts`로 통합:
  - 정규화: 공백·접미사 정리
  - 동의어 통합 (예: "2022개정" + "2022 개정" → "2022 개정 교육과정"으로 표준화)
  - 출현 빈도 + 출처 연도 배열 누적
- 출력: 키워드 단위 레코드

```json
[
  { "keyword": "2022 개정 교육과정",
    "occurrences": [
      { "year": 2024, "session": "논술", "item_no": 1 },
      { "year": 2023, "session": "A", "item_no": 5 },
      ...
    ],
    "total": 18 },
  ...
]
```

**검증**:
- 키워드별 출현 ≥ 1
- dedup 후 키워드 수 적정 (수백~수천 예상)

### 4.7 Step 05 — 운영자 검토 UI

**라우트**: `/admin/seed-review` (별도 페이지)
**기능**:
- exam_papers / exam_items 테이블의 verified=false 레코드 큐
- 각 레코드 카드: 본문, AI 태깅, 모범답안 표시 + 편집 가능
- "검증 완료" 토글 → `verified=true` + `audit_log` 기록
- 일일 N건 검토 가능 형태

**MVP 범위**:
- Phase 1 끝부분에 간이 페이지로만 (본격 admin 도구는 Phase 2)
- 디자인은 임용고시 레이아웃 이미지 6의 "검증 미완료" 배지 그대로 차용

### 4.8 Step 06 — 카드 자동 파생 (Idempotent)

**입력**: `exam_items` 테이블 (DB 적재 후) + items.json 해시
**출력**: `cards` 테이블

**로직** (Appendix A #3 정합):
- `cards.type='quiz'` ← `exam_items WHERE format='서술형' AND year >= 2014 AND verified=true`
  - **풀이 트랙 큐는 verified=true 카드만 합류** (Appendix A #5)
  - `front_md` = `stem_md`
  - `back_md` = `answer_key_md`
  - `source_item_id` = `exam_items.id`
  - `user_id` = NULL (shared)
- `cards.type='keyword'` ← Step 04b dedup 결과
  - `front_md` = `## 키워드: ${keyword}`
  - `back_md` = `### 출현 이력\n- 2024 논술 1번\n- 2023 A 5번\n...`
  - `source_item_id` = NULL (다중 출처)
  - `user_id` = NULL
- **Idempotency**: 모든 INSERT는 `ON CONFLICT (source_item_id, type, user_id) DO UPDATE SET front_md=EXCLUDED.front_md, back_md=EXCLUDED.back_md`. items.json 해시 비교로 변경분만 처리.

**검증**:
- 풀이 카드 수: 580 ± 50 (서술형 13년치, verified=true 비율에 따라 점진 증가)
- 키워드 카드 수: 수백~수천
- 각 카드 본문 길이 sanity
- **재실행 idempotency 단위 테스트**: 동일 papers.json 두 번 실행 후 `cards` row count 동일 확인

---

## 5. Phase 2 — Progress 공식 갱신

### 5.1 기존 코드 갱신

`src/lib/progress/score.ts` (기존 파일 — Read 먼저, 헌법 제20조)
- 어휘 마스터율 0.4 → 풀이 마스터율 0.5
- 오답 정복률 0.3 → 키워드 마스터율 0.2
- 학습 일관성 0.3 → 그대로

`src/lib/progress/score.test.ts` 갱신
- 새 공식 단위 테스트 (3축 가중 평균, 0~100 정규화 검증)

### 5.2 검증 (헌법 제24조의3)

- `npm test` (`progress/score.test.ts` 회귀)
- `npm run build` (스키마 변경 동반이므로 의무)

---

## 6. 운영 흐름

### 6.1 1회성 시드 실행 (런칭 전)

```
Day 1   Phase 0 — 스키마 마이그레이션, build 통과
Day 2   Step 01·02 (PDF 정규화 + 텍스트 추출, 약 50 PDF)
Day 3   Step 03·04a (문항 분리 + 풀이 태깅·모범답안)
Day 4   Step 04b·06 (키워드 + cards 파생, verified=false 상태로 적재)
─── 출시 가능 시점 ────
Day 5+  Step 05 (운영자 검토, 비동기 백로그) — 풀이 트랙 큐는 verified=true 카드만 점진 합류
```

> **검토 큐는 출시 차단 요소가 아니다** (Appendix A #2). 모범답안 검증은 일일 백로그로 진행되며, verified=true 카드만 풀이 트랙에 노출되어 사용자 학습 효과의 부정 강화(잘못된 모범답안 학습)를 방지한다 (Appendix A #5). 미검증 키워드 카드는 트렌드 분석 가치만 있어 노출 가능.

### 6.2 매년 갱신

```
새 연도 PDF 1세트 (3 PDF) 추가 → 01~04~06 재실행 → 검토 (~1일)
```

---

## 7. 위험·백업 (헌법 제35조 정합)

| 위험 | 백업 |
|------|------|
| Gemini OCR 실패 (스캔 PDF) | 운영자 수동 텍스트 입력 → `raw.txt` 직접 작성 |
| 표·그림 보존 어려움 | 본문은 텍스트, 표·그림은 PDF 이미지 URL로 별도 저장 |
| AI 태깅 오류 | `verified=false` 배지 + 검토 큐 + 사용자 신고 |
| 검토 부담 폭주 | Phase 1 시드는 풀이 카드 우선, 키워드는 자동 신뢰 (검토 후순위) |
| Gemini multi-speaker TTS 가용성 | 본 plan 범위 외 — Phase 1 후반에 별도 검증 |
| 비용 초과 | 모든 Gemini 호출은 dry-run 옵션 + 실측 후 본실행 |

---

## 8. 작업 단위 분할 (D-스텝)

각 D-스텝은 헌법 제24조의3·4 정합 — 단위 검증 통과 후 자동 커밋·푸시 가능.

| D-스텝 | 산출물 | 검증 |
|--------|--------|------|
| D-S1 | Phase 0 스키마 9 테이블(+ user_card_state) + index.ts | `npm run build` |
| D-S2 | `scripts/seed/lib/file-name-parser.ts` + 단위 테스트 | `npm test` |
| D-S3 | `01-normalize-papers.ts` + papers.json 생성 + 2009/2010 통합본 처리 결정 | sanity assertion |
| D-S4a | `02-extract-text.ts` (unpdf 본체) | 텍스트 PDF 50% 이상 처리 |
| D-S4b | 페이지 렌더링 라이브러리 도입 (`pdfjs-dist` 등) | `npm run build` (의존성 추가) |
| D-S4c | Vision OCR 폴백 + 1개 스캔 PDF 통합 테스트 | `npm test` |
| D-S5 | `03-split-items.ts` + 프롬프트 (한글 하위 발문 처리, few-shot) | items.json sanity + 운영자 1차 게이트 |
| D-S6a-단기 | Anthropic SDK 통합 + **Sonnet 4.6 dry-run** (5 PDF 샘플) — 토큰·달러 실측 + prompt caching 효과 측정 | log JSON, 사용자 승인 |
| D-S6a-장기 | (런칭 후) **Gemini Pro/Flash dry-run** (5 PDF) — 매년 갱신 자동화용 | log JSON, 사용자 승인 |
| D-S6b | `04a-tag-quiz.ts` (단기 = Sonnet, 장기 = Gemini) + 모범답안 (verified=false 적재) | tagged.json (서술형만) |
| D-S7 | `04b-tag-keywords.ts` + dedup (의미 중심 통합) | keyword tagged |
| D-S8 | `06-derive-cards.ts` (DB 적재, **idempotent UPSERT**) | cards 테이블 sanity + 재실행 동일 row count 테스트 |
| D-S9 | `/admin/seed-review` UI | 화면 동작 + verified=false 배지 정확 노출 검증 |
| D-S10 | `progress/score.ts` v3.0 갱신 + 테스트 | `npm test` + `npm run build` |

> 헌법 제24조의3 2항 — 의존성 추가·DB 스키마 변경·미들웨어 변경 시 `npm run build` 의무. D-S1·D-S4b·D-S10 모두 해당.

---

## 9. 다음 단계

본 plan 완료 후:
- DB 시드 적재 완료, cards 테이블에 풀이 + 키워드 카드 약 1000+ 장 보유
- Phase 1 페이지 구현 진입 (헌법 부칙 제3조 3항)
  - 우선순위: **기출분석 → 풀이 → 학습 → 팟캐스트 → 대시보드 → 학습계획 → 마이**
  - 각 페이지 와이어프레임은 `ui-ux-pro-max` 또는 `frontend-design` 스킬로 별도 작업

---

*본 plan은 디자인 문서 `2026-05-06-fitly-v3-임용-design.md`의 7항(시드 파이프라인)을 코드 단위로 구체화한 것이며, 헌법 v3.0 부칙 제3조의 다음 단계 1·2를 합쳐 다룬다.*

---

## Appendix A — Plan Review Findings (2026-05-06)

엔지니어링 매니저 + 적대적 시점 병렬 검토 결과 7개 ship-blocker 식별. 본문에 inline 반영한 항목과 부록 보강 항목으로 분리.

### A.1 본문 inline 반영 (4건)

| # | 시점 | 이슈 | 본문 반영 |
|---|------|------|----------|
| #1 | ENG | D-S4 OCR 폴백을 단일 D-step에 묶어 검증 불가 + 의존성 추가 누락 | §8 D-step을 D-S4a/4b/4c 3개로 분리, 의존성 추가 시점 build 의무 명시 |
| #2 | ENG | 검토 큐 1주 안 불가능 (실측 10~50시간), 비현실 인력 가정 | §6.1에서 검토를 출시 차단 요소에서 제외, 비동기 백로그로 명시 |
| #3 | ADV | Idempotency 미설계 — 재실행 시 카드 중복 + UNIQUE 제약 누락 | §3.2 schema에 `UNIQUE(source_item_id, type, user_id)` + §4.8에 ON CONFLICT UPSERT 명시 |
| #5 | ADV | AI 모범답안 오류가 부정 강화 — verified=false 배지로 면책 안 됨 | §4.8에 풀이 트랙 큐는 verified=true 카드만 합류 명시. 미검증은 키워드 트랙으로만 노출 |

### A.2 부록 보강 (3건)

#### #4 [ADV] 모델별 비용 추정 (헌법 v3.1 매트릭스 정합)

**단기 (Sonnet 4.6 1M, prompt caching 적용)**

- 실측 추정: 1,080 + 325 + 60 ≈ **1,465 호출**
- 호출당 평균 입력 4K + 출력 4K 토큰
- 단가: 입력 $3 / 1M, 출력 $15 / 1M
- 입력 5.86M × $3 = $17.6 → caching 70% 절감 → **$5.3**
- 출력 5.86M × $15 = **$87.9**
- **단기 합계: $93** + 안전마진 1.7 = **$158**
- 또는 caching 보수적 (50%) → 입력 $8.8 + 출력 $87.9 = **$96.7** + 1.7 = **$164**
- **현실 범위: $90~165**

**장기 (Gemini 매트릭스, 매년 갱신)**

- 매년 신규 PDF 3개 (논술 1 + A 22 + B 22 = 45 문항)
- Step 03 = Pro 3 호출 (~$0.3)
- Step 04a 모범답안 = Pro ~25 호출 (~$1)
- Step 04b 키워드 = **Flash** 45 호출 (~$0.05)
- 태깅 = **Flash** 25 호출 (~$0.05)
- **장기 매년 합계: ~$1.5** (Pro 단일 사용 시 $5와 비교 70% 절감)

**최초 풀스코프 시드를 장기 매트릭스로 했을 경우 (참고)**

- Pro 분리·모범답안 + Flash 태깅·키워드 = **$15~30** (안전 마진 포함)
- 즉 비용만 보면 단기보다 5~10배 저렴하나, 한국어 서술 품질 차이로 **단기는 Sonnet 4.6 채택** (헌법 v3.1 결정)

**헌법 제35조 "비용 초과" 위험 차단**: dry-run 없이 본실행 시 회사 키 한도 초과 가능
**D-S6a-단기 게이트**: 5개 PDF Sonnet 4.6 샘플 실측 + caching 효과 검증 + 사용자 승인

#### #6 [ENG] 스키마 gap — FSRS 위치, 인덱스, RLS, FK 캐스케이드

- **FSRS 위치 충돌 해소**: 디자인 문서 5.2(`cards.fsrs_state`)와 plan 3.2(`user_card_log.fsrs_state`)이 충돌했던 것을 **`user_card_state` 별도 테이블** (1 row per user×card, 즉시 조회용) + `user_card_log` (등급 이력 append-only)로 분리
- **FK 정책**: `cards.source_item_id ON DELETE CASCADE` (시드 갱신 시 자동 정리), 사용자 데이터 FK는 `RESTRICT` (실수 삭제 차단)
- **필수 인덱스**: `cards(user_id, type)`, `user_card_state(user_id, due_at)`, `user_card_log(user_id, card_id, reviewed_at)`, `exam_items(year, session)`
- **RLS / user_id 강제**: 헌법 제28조 1항 정합. Drizzle 직접 연결 환경에서는 모든 쿼리에 `user_id` 일치 강제 — 별도 헬퍼 `withUserScope()`를 D-S1과 함께 도입

#### #7 [ENG/ADV] 한글 PDF 문항 분리 신뢰성 + 2009/2010 통합본 영향

- **하위 발문 처리**: 한국 시험지의 「가/나/다」 「(1)~(5)」 발문은 최상위 문항 안에 보존 (별 항목으로 분리 X). Step03 프롬프트에 명시 + few-shot 2~3개 (D-S5)
- **2009/2010 통합본 처리**: 별도 D-S3 이전에 운영자 수동 분리 1회 작업으로 처리 (시험지 PDF를 교직논술/A/B로 페이지 자르기). 미처리 시 키워드 트렌드 풀스코프(2002~2026)에 2년 구멍 발생 → 헌법 제3조의2 정직성에 따라 UI에 누락 표기 의무
- **자동 정합 게이트**: D-S5 검증에 "교육과정 A·B는 22문항" 자동 알람 + 미스매치 시 운영자 1차 확인 게이트 (validation.json에만 적는 것 X)

### A.3 잠재 후속 이슈 (모니터링)

- 키워드 dedup의 의미 충돌 (객관식 시대와 서술형 시대 표기 동일·의미 다른 키워드) — Step04b dedup 로직에서 출현 시기·문맥을 메타로 보존하여 사용자 검색 시 시기별 필터 가능하게 설계
- Gemini multi-speaker TTS의 한국어 화자 품질 — Phase 1 후반에 별도 검증 (본 plan 범위 외, 팟캐스트 페이지 작업 시점)
- `/admin/seed-review` UI는 D-S9에서 최소 기능만 구현. 본격 admin 도구는 Phase 2

### A.4 결과 종합

본 검토 결과를 통해:
- **출시 차단 요소 1개 → 0개**: 검토 큐를 비동기로 분리해 1주 안 출시 가능 경로 확보
- **재실행 안전성 확보**: idempotent UPSERT + UNIQUE 제약
- **학습 효과 보호**: 풀이 트랙은 verified=true만, 미검증은 학습 큐에서 차단
- **비용 게이트 신설**: D-S6a 사용자 사전 승인
- **스키마 명세 보강**: user_card_state 분리 + 인덱스·FK 정책 명시
- **한글 처리 신뢰성**: few-shot + 운영자 게이트

검토 후 D-step 수: 10 → **12** (D-S4 분리 + D-S6a 비용 게이트 추가).
