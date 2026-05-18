# Fitly · Gemini CLI 인수인계서 (GEMINI.md)

> **목적**: Claude Code → Gemini CLI 개발 환경 전환을 위한 단일 통합 문서.
> 헌법층(8개 절대 원칙) · 부칙 · 법률층(9) · 시행령층(5) · 시행규칙층(5) · 디자인 시스템 ·
> 시드 LLM 하네스 · 개정 이력 · 현재 프로젝트 상태 · Gemini 운영 가이드를 한 파일에 인라인.
>
> **버전**: 헌법 v3.6.4 (2026-05-15 시행) + 2026-05-17~18 누적 fix 반영
> **작성일**: 2026-05-18
> **이전 진입점**: `fitly/CLAUDE.md` (Claude Code 용 인덱스, 동일 헌법 참조)

---

## 목차

- [0. Migration Notes — Claude Code → Gemini CLI](#0-migration-notes--claude-code--gemini-cli)
- [1. 헌법층 — 8개 절대 원칙](#1-헌법층--8개-절대-원칙)
- [2. 부칙 (BYLAWS)](#2-부칙-bylaws)
- [3. 법률층 (Laws 10~18) — 9개](#3-법률층-laws-1018--9개)
- [4. 시행령층 (Decrees 21~25) — 5개](#4-시행령층-decrees-2125--5개)
- [5. 시행규칙층 (Rules 31~35) — 5개](#5-시행규칙층-rules-3135--5개)
- [6. 디자인 시스템 (DESIGN.md 본문)](#6-디자인-시스템-designmd-본문)
- [7. 시드 LLM 4계층 하네스](#7-시드-llm-4계층-하네스)
- [8. 헌법 개정 이력 (CHANGELOG)](#8-헌법-개정-이력-changelog)
- [9. 현재 프로젝트 상태 (2026-05-18)](#9-현재-프로젝트-상태-2026-05-18)
- [10. Gemini CLI 운영 가이드](#10-gemini-cli-운영-가이드)

---

## 0. Migration Notes — Claude Code → Gemini CLI

### 0.1 환경 차이

| 항목 | Claude Code | Gemini CLI |
|---|---|---|
| 인덱스 파일 | `fitly/CLAUDE.md` (80줄 상한) | `fitly/GEMINI.md` (본 파일, 단일 통합) |
| 4계층 위계 본문 | `.claude/{CONSTITUTION,BYLAWS,laws,decrees,rules}/` (분리) | 본 파일 §1~§5 (인라인) |
| 디자인 시스템 | `fitly/DESIGN.md` | 본 파일 §6 + `fitly/DESIGN.md` 원본 (이중 보존) |
| 하네스 | `docs/harness/seed-llm-prompts.md` | 본 파일 §7 |
| 개정 이력 | `.claude/CHANGELOG.md` | 본 파일 §8 |
| 스킬 시스템 | 100+ skills (`.claude/skills/*`) 자동 호출 | **없음** — 본 파일 §10.1 에 작업 분류별 직접 작업 가이드 |
| 메모리 시스템 | `/home/jovyan/.claude/projects/.../memory/` 자동 로드 | **없음** — 본 파일 §9.5 에 핵심 컨벤션 인라인 |

### 0.2 동일 인프라

- **GitHub**: `github.com/Cazeko/vibe2026-new` (동일 저장소)
- **Vercel**: 동일 프로젝트 (Hobby plan)
- **Supabase**: `adihnfvacezivlrfbfzp.supabase.co` (동일)
- **Gemini API key**: 동일 (`.env.local`)
- **모든 env 변수**: 동일

### 0.3 변하지 않는 것

- 헌법 8개 절대 원칙 — Claude/Gemini 무관 영구 적용
- 사용자(주관자) = **"주인님"**, 모든 대화 **존댓말**
- 펀치라인 = **"합격은 시간이 아니라 적합도다."**
- 4계층 위계 우선순위 (헌법 → 법률 → 시행령 → 시행규칙)

---

## 1. 헌법층 — 8개 절대 원칙

> 원본: `fitly/.claude/CONSTITUTION.md` (v3.5 채택 2026-05-06, 80줄 상한 강제)

### 1.1 메타 — 명칭과 사명

#### 제1조 (명칭)
본 시스템의 정식 명칭은 **"Fitly"** 이며, 펀치라인(제4조)의 "적합도"(Fitness)와 어원을 공유한다. 사용자 명시 승인 없이 변경하지 아니한다.

#### 제3조 (사명)
Fitly의 사명은 **"임용 학습의 정직한 자동화"** 이다. 사설 학원·인강·족보 의존 환경의 격차를 공개 기출 시드 분석·역산 학습 플래닝·정답 4계층 검증으로 완화한다 (제3조의2 정합).

### 1.2 8개 절대 원칙

#### 원칙 1 — 호칭과 어투 (제0조)
사용자(주관자) 호칭은 **"주인님"**, 모든 대화는 **존댓말**. 본 조항은 모든 다른 조항보다 우선한다.

#### 원칙 2 — 제품 정의 (제2조 — v3.5.3 개정)
Fitly는 **한국 초등교사 임용시험 1차** (교직논술 + 교육과정 A·B) 준비를 위한 **학습 플래너 PWA** 이다. 사용자 자료 업로드는 범위에서 제외 (v3.0.1 cut). **공간**: 태블릿 가로(1024×768)·데스크톱·**모바일 1차 지원** (v3.5.3 — 종전 모바일 폴드백 정책 격상. 팟캐스트 등 이동 중 학습 시나리오 정합).

#### 원칙 3 — 정직성 원칙 (제3조의2)
**합격 보장·합격 가능성·지역별 합격 컷 추정** 등 외부 비공개 데이터에 의존하는 약속을 일체 하지 아니한다. 정직성이 곧 차별 메시지다.

#### 원칙 4 — 펀치라인 (제4조 — v3.5.1 개정)

> **"합격은 시간이 아니라 적합도다."**

본 펀치라인은 사용자 명시 승인 없이 변경하지 아니한다. 변경 시 제1조(명칭)의 어원 정합도 함께 갱신한다.

#### 원칙 4-2 — 한글 줄바꿈 원칙 (제4조의3 — v3.5.1 신설, v3.5.2 보강)
모든 한글 UI 문구의 줄바꿈은 **의미 단위 · 시각적 균형 · 가독성**을 동시에 만족하도록 설계한다. 자동 줄바꿈(브라우저 word-wrap)에만 의존하거나 임의 위치에서 자르지 아니한다. 본 원칙은 모든 **헤드라인 · 서브타이틀 · 본문 · 카드 텍스트**에 적용된다.

**보강 (v3.5.2 — 2026-05-12)**: 모든 한국어 문장의 **마침표(.) 직후에는 반드시 공백**을 둔다. 쉼표(,), 가운뎃점(·), 콜론(:) 등 부호 직후에도 가독성 보장을 위해 공백을 둔다(단 "0.5" 등 숫자 소수점 · "v3.5.1" 등 버전 표기는 예외).

#### 원칙 5 — 스코프 보호 (제16조 — v3.6.4 전면 개정 · 2026-05-15)
**사용자(주관자)의 명시 요청 시 신규 기능을 추가한다.** 명시 요청이 없는 모호한 요청은 *기존 기능 다듬기* 로 해석한다. Claude/Gemini 의 자가 판단에 의한 신규 기능 추가는 금지된다.

**단서 (v3.5.3 잔존)**: 외부 사용성 평가·접근성 점검·시각 위계 보강에 기반한 UI 개선은 *기존 기능 다듬기* 로 분류한다.

**단서 (v3.6.1 잔존)**: 풀이 트랙(quiz/mistake)의 AI 학습 도우미는 PR 1~5 의 AI 서술형 분석 인프라(`user_card_ai_analysis` 캐시·Gemini Flash wrapper)의 *자연 확장* 으로 분류한다.

**v3.6.4 개정 사유**: 사용자 발화 2026-05-15 — *"일단 신규 기능을 추가하면 안된다는 헌법 조항 없애. 내가 추가하라면 그냥 추가해"*.

#### 원칙 6 — 헌법 근거 의무 (제24조의2)
모든 결정·보고·진행은 헌법 조항을 근거로 명시한다. 근거 없는 결정은 임의적이며 본 헌법에 반한다.

#### 원칙 7 — 개정 요건 (제40조)
본 헌법은 **사용자(주관자) 명시 승인** 없이 변경하지 아니한다. AI 는 발의(제42조 5요소)만 가능하며 자가 개정은 절대 금지(제43조).

### 1.3 위계 우선순위 (제38조 v3.4 + R004 H1)

충돌 발생 시 다음 순서로 적용:

1. **헌법층** — 본 §1 (8개 절대 원칙)
2. **법률층** — 본 §3 (10~18)
3. **시행령층** — 본 §4 (21~25)
4. **시행규칙층** — 본 §5 (31~35)
5. **디자인 시스템** — 본 §6 + `fitly/DESIGN.md` (법률층 동급)
6. **`fitly/docs/plans/`** — 디자인·기획 문서 (시행규칙층 동급)
7. **사용자 즉시 발화** — 별도 우선 명시 시 본 헌법보다 우선

동일 계층 내 충돌은 **신법 우선·특별법 우선** 원칙으로 해소한다 (한국 법체계 정합).

---

## 2. 부칙 (BYLAWS)

> 원본: `fitly/.claude/BYLAWS.md` (v3.5 채택 2026-05-06)

### 부칙 1 (시행일)
본 헌법은 **채택일부터 시행한다**. 단, v3.4 4계층 분리는 2026-05-06부터 시행됨을 확인한다.

### 부칙 2 (개정 이력의 보존)
헌법 개정 시 본 §8 (CHANGELOG) 에 즉시 반영한다 (제45조 정합).

### 부칙 3 (길이 상한 권고)

| 계층 | 상한 | 비고 |
|---|---|---|
| 헌법층 (`.claude/CONSTITUTION.md`) | **80줄** | 강제 — 7±2 절대 원칙 외 추가 시 부칙·메타 분리 의무 |
| 헌법 부칙 (`.claude/BYLAWS.md`) | 100줄 | 권고 |
| 법률층 (`.claude/laws/`) | 각 200줄 | 권고 |
| 시행령층 (`.claude/decrees/`) | 각 150줄 | 권고 |
| 시행규칙층 (`.claude/rules/`) | **무한** | R004 H3 정합 — H2 자기집행 시 H3 무한 성장 허용 |
| **본 GEMINI.md** | **무한** | Gemini CLI 단일 통합 파일이라 상한 미적용 |

### 부칙 4 (v3.x 기간 운영 권한)
v3.x 기간(임용 1차 D-90 ~ D-0)은 **시행규칙층 무한 성장**을 허용한다.

### 부칙 5 (메모리 시스템과 헌법의 관계)
AI 의 메모리 시스템 항목 중 헌법과 직접 충돌하는 것은 본 헌법이 우선한다 (제38조 정합). 메모리는 *작동 컨텍스트* 이며 *규범* 이 아니다.

---

## 3. 법률층 (Laws 10~18) — 9개

### 3.1 법률 10 — UX 핵심 원칙 (수상작 DNA)

> 원본: `fitly/.claude/laws/10_ux_principles.md` (제5·6·7·8조)

#### 제5조 (진입장벽 0)
사용자가 첫 가치를 경험하기까지의 행동 수는 **3 이하** 여야 한다 (가입 → 시험일 등록 → 대시보드 진입).

> **단서 (v3.0)**: 첫 가치 경험은 *"시험일을 입력한 직후 24년치 출제 분포 히트맵이 즉시 보이고, 오늘의 3 트랙 SRS 큐가 자동으로 채워지며, 추천 팟캐스트 1편이 자동 생성되는 순간"* 으로 정의한다.

#### 제6조 (즉각적 가치)
모든 핵심 액션은 **5초 이내** 가시적 결과를 반환해야 한다.

#### 제7조 (마법성)
사용자가 "이게 어떻게 됐지?" 라고 느끼는 변환 지점이 최소 1개 이상 존재해야 한다. 현재 (v3.0):
1. **시험일 입력 즉시 24년치 출제 트렌드 시각화 노출**
2. **NotebookLM 스타일 팟캐스트 자동 생성**

#### 제8조 (도파민 트리거)
사용자의 행동 직후 **숫자가 변하는** 시각적 피드백을 반드시 제공한다.

### 3.2 법률 11 — Progress 점수 (학습 진척도)

> 원본: `fitly/.claude/laws/11_progress_score.md` (제9·10·11·12조, v3.0 전면 개정)

#### 제9조 (Progress 공식)

```
Progress = (풀이 마스터율 × 0.5) + (키워드 마스터율 × 0.2) + (학습 일관성 × 0.3)
         (0~100 정규화)

풀이 마스터율    = FSRS state ≥ Review 인 quiz cards 수 / 전체 quiz cards 수
키워드 마스터율  = FSRS state ≥ Review 인 keyword cards 수 / 전체 keyword cards 수
학습 일관성     = 최근 14일 학습한 일수 / 14
```

본 공식은 `src/lib/progress/score.ts` 에 구현된다. 사용자 명시 승인 없이 변경 금지.

본 점수는 **본인 학습의 상대 진척도** 지표이며, *지역별 합격 적합도와는 무관* 하다.

#### 제10조 (Progress 점수의 표현)
1. **"합격 가능성"**, **"합격 확률"**, **"점수 예측"**, **"지역 핏"**, **"교육청 핏"** 표현 금지.
2. 정식 표현은 **"학습 진척도"**, **"Progress 점수"** 한정.
3. UI 라벨에 "절대 점수가 아닌 본인 진척도" 명시.
4. 발표·UI·문서·홍보물 위반 발견 시 즉시 수정.

#### 제11조 (데이터 토대 — v3.0 단순화)
1. Progress 는 **본인 계정의 학습 데이터** 만으로 산출.
2. 외부 합격 컷·평균·가중치 시드에 의존하지 아니한다.
3. AI 가 합격 가능성·점수 예측을 추정해 노출하는 행위는 금지.

#### 제12조 (방어 논리)

> "본 78점은 *지역별 합격 적합도가 아닙니다*. 사용자 본인의 학습 데이터 3축의 가중 평균이며, 어제 70점에서 오늘 78점으로 오른 것은 *본인이 어제보다 8점만큼 더 잘 학습했다* 는 의미입니다."

### 3.3 법률 12 — 사이드바 구조 + 카드 분류 + 팟캐스트

> 원본: `fitly/.claude/laws/12_sidebar_structure.md` (제13·13조의2·13조의3, v3.0 전면 개정)

#### 제13조 (사이드바 7+1+2 구조)

**Phase 1 메인 메뉴 7 + 신규 1**:
1. **대시보드** (`/dashboard`)
2. **기출 분석** (`/exam-analysis`) — 4 탭: 기출문제·분석·토픽맵·로드맵
3. **풀이** (`/study/quiz`)
4. **학습** (`/study`) — 3 트랙 SRS: 풀이/키워드/오답
5. **팟캐스트** (`/podcast`)
6. **학습 계획** (`/study-plan`)
7. **마이 페이지** (`/me`)

**Phase 2 추가 메뉴 2** [v3.0.1 — 자료 관리 폐기]:
- **오답 노트** (`/mistakes`)
- **학습 분석** (`/study-analysis`)

**시스템 2**: 설정, 로그아웃

#### 제13조의2 (학습 카드의 출처와 분류 — v3.0 전면 개정)

| 종류 | 영문명 | 출처 | `cards.type` | 노출 위치 |
|---|---|---|---|---|
| 풀이 카드 | `QuizCard` | 시드 `exam_items` 중 **2014~2026 서술형만**. 본문 = **PDF 원본** | `quiz` | 사이드바 "풀이" + "학습" 풀이 트랙 |
| 키워드 카드 | `KeywordCard` | 시드 `exam_items` 키워드 + **객관식 시대(2002~2013) 문항 분석에서 추출한 개념** | `keyword` | 사이드바 "학습" 키워드 트랙 |
| 오답 카드 | `MistakeCard` | `QuizCard` 의 again/hard 자동 합류 + 사용자 직접 추가 | `mistake` | 사이드바 "학습" 오답 트랙 |

**핵심 규칙**:
1. 세 종류 모두 **`ts-fsrs` SRS 큐** 에 통합.
2. 카드 출처를 가시적으로 표시 — "2024 교직논술 1번", "키워드 #2022개정 교육과정", "오답 합류".
3. **AI 무작위 학습 카드 생성은 어떠한 출처에서도 금지** (제14조 3항 정합).
4. 데시보드 파생 위젯은 *집계·시각화* 산출물 — 새로운 카드 종류로 보지 아니한다.
5. **카드 간 합류** — `again/hard` 등급 시 `MistakeCard` 자동 합류, `source_item_id` 추적, 중복 차단.
6. 시드 카드는 모든 사용자 동일 본문 — **FSRS 상태와 등급 로그는 사용자별 분리** (`user_card_log`, `user_attempts`).

**v3.2 8항 — 객관식 시대(2002~2013) 처리**:
- **풀이 카드로 출제하지 아니한다.**
- 핵심 개념·정의·관련 출제 이력 → `KeywordCard` 본문(개념 정리 노트)에 흡수.
- 객관식 시대 데이터는 (a) 기출분석 트렌드 시각화 (b) 키워드 카드 본문 — 두 경로로만 노출.

**v3.3 9항 — 시험 문제 본문 100% 정확성 보장 정책**:
- **`stem_text`**: `unpdf` 텍스트 레이어 직접 추출 (OCR 0% 오류). 검색·접근성·복사용.
- **`stem_image_path`**: `pdftocairo` 페이지 PNG. 사용자 화면 시각 자료 (시험지 그대로).
- **LLM 은 본문을 생성·요약·재구성·교정하지 아니한다.**
- 운영자 본문 변경 권한은 PDF 갱신 외 없음.

> **KeywordCard 본문 표준 구조 (v3.2)**:
> - **정의·요지**: 1~3문장
> - **핵심 요소**: 2~5개 bullet
> - **관련 출제 이력**: 좌표 + 묻는 방식 ("정의 묻기" / "적용 묻기" / "분석 묻기")
> - **함께 보는 키워드**: 2~5개

#### 제13조의3 (팟캐스트 콘텐츠 — v3.0 신설)

1. **NotebookLM 스타일 2인 화자 대화체** — Gemini multi-speaker TTS 자동 생성.
2. `podcast_episodes.scope` 두 가지: `shared` (시드 자동) / `user` (개인 즉석 생성).
3. 모든 팟캐스트 본문에 **"AI 생성, 공식 해설이 아님"** 안내 + UI `verified: false` 배지.
4. 청취 진척 = `podcast_progress` 테이블, 사용자별 재개.
5. 외부 팟캐스트(YouTube 등) 임베드 미도입 (저작권·정직성 리스크).

### 3.4 법률 13 — 모듈 cut 결정 + 지역 라벨

> 원본: `fitly/.claude/laws/13_module_scope.md` (제14·15조)

#### 제14조 (모듈 구성 — Cut 결정)

다음 기능 본 대회 출품 범위 **제외**, 재도입 시 헌법 개정 필요:

1. 마인드맵 (Mermaid·Markdown 모두)
2. 자유 노트 에디터
3. 카드의 *AI 무작위 생성* (시드 추출만 허용)
4. 카톡 봇 진입점 (3주 리스크)
5. **사용자 PDF 자료 업로드 + AI 카드 자동 추출** [v3.0.1 신설]

**v3.0.1 cut 사유**:
- 시드 1,000+ 카드(공식 KICE 기출)로 학습 콘텐츠 충분
- PDF 변환 마찰이 헌법 제5조 진입장벽 0과 충돌
- 사설 학원 모의고사 업로드 시 제27조 저작권 위배 회색지대
- v3.0 마법 지점은 시드 분석 즉시 노출 + 팟캐스트 자동 생성으로 재정의

영향: `materials` 테이블·`/materials` 라우트·`/api/materials` 폐기.

#### 제15조 (지역 교육청 라벨 — v3.0 재정의)

1. 사용자 응시 예정 **지역 교육청 17개** 선택 입력 (서울·경기·인천·부산·대구·광주·대전·울산·세종·강원·충북·충남·전북·전남·경북·경남·제주).
2. **합격 컷·평균·경쟁률 추정 시드 미보유** (제3조의2 정합).
3. UI 노출 정보: 공개된 시험일·시험과목·시험시간·시험장소.
4. 입력은 선택 사항, 미입력 시에도 모든 기능 정상 동작.

### 3.5 법률 14 — 기술 스택 + 라이브러리 우선

> 원본: `fitly/.claude/laws/14_tech_stack.md` (제17·19조)

#### 제17조 (불변 스택 — 사용자 승인 시에만 변경)

1. 프레임워크: **Next.js 15.x (App Router)**
2. 언어: **TypeScript (strict mode)**
3. DB: **Supabase Postgres + pgvector**
4. ORM: **Drizzle ORM**
5. 인증: **Supabase Auth** (이메일 + 카카오 OAuth → **2026-05-18 카카오 제거**, 이메일 단일 채널)
6. 배포: **Vercel**
7. PWA: **next-pwa 또는 동등 manifest 기반**
   - Service Worker는 **`/api/*` 응답을 캐시하지 아니한다** (기기 공유 시 인증 응답 누설 방지).

#### 제19조 (라이브러리 우선 원칙)

- 간격 반복(SRS) → **ts-fsrs**
- 차트 → **Recharts**
- 폼 → **React Hook Form + Zod**
- UI 프리미티브 → **Radix UI / shadcn 패턴**

#### 제19조의2 (시드 schema points 타입) [v3.5 신설]

1. `exam_items.points` = **`integer` (number)** (`drizzle-orm/pg-core` 정합).
2. 0.5점 등 소수 점수는 `points_fractional` 또는 `basis_points (1/100)` 정수 변환.
3. v3.5 시점 *전 영역 정수 점수* 만 시드 포함.

### 3.6 법률 15 — AI 사용 규정 (모델 매트릭스)

> 원본: `fitly/.claude/laws/15_ai_models.md` (제18·18의2·18의3, v3.1·v3.6.x 누적)

#### 제18조 (모델 매트릭스)

**1. 시스템 런타임 = Google Gemini 단일 공급자**.
- **단서 (v3.1)**: 운영자 1회성 시드 생성·태깅·모범답안 단계에서 외부 LLM (Anthropic Claude 등) 활용 가능 — 사용자 사전 승인 필요.

**2. 모델 매트릭스 — 기능별 차등** [v3.1 — "성능 최우선" v1.5 폐기]

**A. 시스템 런타임 (앱이 사용자에게 응답)** — v3.6.3 (2026-05-14) 학습 본업 전 Flash 통일

| 작업 | 모델 | 사유 |
|---|---|---|
| Vision OCR (시험지 이미지) | `gemini-3.1-pro-preview` | 멀티모달 1M, 표·이미지 보존 |
| 학습 적합도 해설·코칭 | `gemini-3.1-pro-preview` | 추론 품질 |
| 팟캐스트 스크립트 | `gemini-3.1-pro-preview` | 대화체·multi-speaker |
| 팟캐스트 TTS | Gemini multi-speaker TTS | 한국어 화자 |
| 가벼운 분류·태깅·요약 | **`gemini-2.5-flash`** | 가성비 |
| 실시간 AI 튜터 챗봇 | **`gemini-2.5-flash`** | 빠른 응답. **구현됨** — `chatWithTutor` |
| 힌트 생성 | `gemini-2.5-flash` | 짧은 응답. *Phase 2+* |
| 암기법 생성 | `gemini-2.5-flash` | 짧은 응답. *Phase 2+* |
| 키워드 추출 | `gemini-2.5-flash` | 대량 분류 |
| 서술형 채점 | **`gemini-2.5-flash`** | **속도 우선** (v3.6.3 — Pro→Flash. 1~2초 응답). **구현됨** — `analyzeEssay` |
| 서술형 첨삭 (diff) | `gemini-2.5-flash` | **속도 우선**. **구현됨** |
| 모범답안 생성 | `gemini-2.5-flash` | **속도 우선** (Pro 재격상 검토). *Phase 2+* |
| 임베딩 (RAG, Phase 2+) | `gemini-embedding-2` | 신세대 3072차원 |

**B. 시드 데이터 운영 (1회성·매년 갱신)**

| 작업 | 단기 | 장기 (매년) | 사유 |
|---|---|---|---|
| 시험지 → 문항 분리 | **`claude-sonnet-4-6` (1M)** | `gemini-3.1-pro-preview` | 단기 Anthropic, 장기 Gemini 자동화 |
| 영역/Bloom/형식 태깅 | `claude-sonnet-4-6` | `gemini-2.5-flash` | 장기 대량 → Flash 가성비 |
| 키워드 태깅 + dedup | `claude-sonnet-4-6` | `gemini-2.5-flash` | 동일 |
| 서술형 모범답안 (한국어 4~8문단) | `claude-sonnet-4-6` | `gemini-3.1-pro-preview` | 한국어 학술 문체 |
| Prompt caching | Anthropic prompt caching (5분 TTL) | — | few-shot 컨텍스트 재사용 |

3. **SRS = `ts-fsrs`**. 자체 구현 금지.
4. **PDF 파싱 = `unpdf` (텍스트) + Vision OCR (이미지)**.
5. **환경변수**: `GEMINI_MODEL_PRO`, `GEMINI_MODEL_FLASH`, `GEMINI_EMBEDDING_MODEL`, `ANTHROPIC_MODEL_SONNET`.
6. 매트릭스 변경 = 헌법 개정 절차.
7. **비용·품질 검증 게이트 (v3.1)** — 5 PDF dry-run 후 사용자 승인.

#### 제18조의2 (AI 생성 정답·해설 라벨 의무)

1. AI 추정 정답·해설은 **"검증 필요"** 배지 동반.
2. 사용자 검증 시 다음 단계 라벨로 승격 (제30조의2).
3. 라벨 없는 AI 정답 표시는 헌법 위반.

#### 제18조의3 (객관식 시대 — 연도 범위) [v3.5 신설]

1. **객관식 시대 = 2002~2013학년도 12회분**.
2. 객관식 시대 = **풀이 카드 제외**.
3. 객관식 데이터 = **KeywordCard 흡수** (RAG·토픽맵·로드맵 한정).
4. 2014~ = 서술형 시대 = 풀이 출제 대상.
5. 2001 이하 시드 제외.

### 3.7 법률 16 — 디자인 시스템 (DESIGN.md 우선)

> 원본: `fitly/.claude/laws/16_design_system.md` (제16조의2)

#### 제16조의2

1. 모든 시각·UI 결정은 `fitly/DESIGN.md` (= 본 §6) 의 **단일 SoT** 를 따른다.
2. 폰트·색·여백·레이아웃·모션 변경 = 사용자 명시 승인. 본 조 변경 = 헌법 개정 준한다.
3. 메모러블 앵커 = **"공책 가로 괘선 + 세리프 헤드라인 + 학습 진척도만 컬러로 빛난다"**.
4. 액센트 `#1F5C4A` = *오직* 6곳:
   - (a) Progress 게이지
   - (b) 1차 액션 CTA
   - (c) +N% 델타
   - (d) 활성 사이드바 항목
   - (e) AI 추천 카드 강조
   - (f) 로그인/회원가입 랜딩 hero 잉크 trail (v3.6 추가)
5. AI 코드 생성 전 `DESIGN.md` 우선 참조.
6. 디자인 시스템 미리보기 = `~/.gstack/projects/Cazeko-vibe2026-new/designs/design-system-20260505/preview.html`.
7. **절대 금지 폰트**: Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, Comic Sans, Papyrus.

### 3.8 법률 17 — 보안 + 개인정보 + 윤리

> 원본: `fitly/.claude/laws/17_security_privacy.md` (제27·28·29·30조)

#### 제27조 (저작권)
1. 학원·인강·사설 자체 교재의 무단 RAG 인덱싱 금지.
2. 모든 기출 = **국가공식 출처** (한국교육과정평가원 등, `fitly/kice_pdfs/`).
3. 출처 메타 보존 (`exam_papers.source_url`).
4. AI 생성 모범답안·해설·팟캐스트 = 공식 자료 아님 라벨 명시 (제18조의2).

#### 제28조 (개인정보)
1. 사용자 업로드 자료 = 본인 외 접근 차단 (Supabase RLS 의무). 단, Drizzle ORM 이 PostgREST 우회 시 코드에서 **모든 쿼리에 `user_id` 컬럼 일치 강제** + 코드 리뷰로 누락 차단.
2. 학습 기록·Fit 점수 히스토리 = 사용자 동의 없이 외부 노출 금지.
3. ~~카카오 OAuth~~ → **2026-05-18 카카오 제거**.

#### 제29조 (책임 회피 표현)
1. **"합격 보장"**, **"100% 합격"**, **"합격 예측"** 등 단정 표현 금지.
2. 모든 점수·진단·추천에 *참고용* 명시.

#### 제30조 (할루시네이션 차단 의무)
1. 임용 시험·교육청 정보·합격 컷·평균 = **반드시 시드 DB 또는 공식 출처**.
2. LLM 이 임용 시험 메타 데이터 자체 생성 금지.
3. 출처가 있는 경우 출처 함께 표시.
4. AI 생성 = 본문 시드(국가공식 기출) 기반 추론 한정. 외부 사설 학원 해설 직접 인용·재생성 금지.

### 3.9 법률 18 — 정답·해설 출처 4계층 모델

> 원본: `fitly/.claude/laws/18_source_credibility.md` (제30조의2)

#### 제30조의2 (4계층 모델)

| 라벨 | 영문 enum | 의미 | UI 배지 |
|---|---|---|---|
| 공식 | `official` | 학교 공시 정답 또는 검증 가능한 1차 출처 | "공식" (회색) |
| AI 추정 | `ai_estimate` | Gemini 본문 추정 답·해설 | "검증 필요" (앰버) |
| 자가 정정 | `user_self_corrected` | **단일 사용자(본인)** 직접 정정 | "내가 정정" (스카이) |
| 크라우드 검증 | `crowd_verified` | **2명 이상의 서로 다른 사용자가 동일한 답 제출** | "검증됨" (인디고) |

**단계적 결합**:
- 단계 1: AI 추정 즉시 노출 (콜드 스타트)
- 단계 2: 본인 자가 정정 → `user_self_corrected` (단일 의견)
- 단계 3: 학교별 공식 정답지 확보 → `official` 승격
- 단계 4: 2명 이상 동일 답 제출 → `crowd_verified` 승격

라벨 변경 이력 카드별 메타 기록. 발표·UI·홍보 일관 사용 (제12조 정합).

---

## 4. 시행령층 (Decrees 21~25) — 5개

### 4.1 시행령 21 — 개발 규율

> 원본: `fitly/.claude/decrees/21_development_discipline.md` (제20·21·22·23조)

#### 제20조 (Read 먼저 Edit)
어떤 파일도 **Read 도구로 먼저 읽지 아니하고 수정하지 아니한다.**

#### 제21조 (TypeScript Strict)
모든 코드는 `tsconfig.json`의 `"strict": true` 하 **타입 에러 0** 빌드. `any` 사용 시 사유 주석 명시.

#### 제22조 (한국어 우선)
1. 사용자 가시 텍스트 = **한국어**.
2. 코드 식별자 = **영어**.
3. 커밋 메시지 = 한국어 또는 영어.

#### 제23조 (불필요 산출물 금지)
1. 사용자 미요청 README·문서·데모 파일 미생성.
2. 사용자 미요청 이모지 코드·문서 미삽입.
3. 사용자 미요청 댓글·docstring·로깅 미추가.

### 4.2 시행령 22 — 검증 의무

> 원본: `fitly/.claude/decrees/22_validation.md` (제24·24조의3)

#### 제24조 (검증 의무)
의존성 추가·스키마 변경·빌드 설정 수정 시 **반드시 `npm run build`** 또는 동등 검증.

#### 제24조의3 (운영 기준)

**`npx tsc --noEmit` (5~10초)** 으로 충분:
- 컴포넌트·페이지 단순 수정
- 스타일·문자열·타입 보강
- 기존 모듈 내부 리팩터링

**`npm run build` (수 분)** 의무:
- 의존성 추가·제거·업그레이드
- DB 스키마 변경
- `next.config.mjs` / `tailwind.config.ts` / `tsconfig.json` / `drizzle.config.ts` 수정
- 미들웨어 변경
- 라우트 추가·제거 (app/ 디렉토리 변경)
- 환경 변수 흐름 변경

단위 테스트 영역 수정 시 **`npm test`** 함께 수행.

### 4.3 시행령 23 — 자동 푸시 기준

> 원본: `fitly/.claude/decrees/23_auto_push.md` (제24조의4)

#### 제24조의4

**자동 푸시 허용 시점**:
- D-스텝 완료 + 검증 통과 직후
- 헌법 개정 적용 직후
- 보안·버그 수정 검증 직후
- 사용자 명시 "푸시" 지시

**자동 푸시 금지 시점**:
- 빌드·테스트 실패 상태
- 미완 상태
- `.env`, API 키, 토큰, 사용자 자료 스테이지 포함
- 원격 저장소 미설정

**의무 절차**:
- `git status` 의도 외 파일 확인
- 비밀 정보 (`.env*`, `*.key`, `*token*`) 스테이지 점검
- `git-commit-helper` 스킬 호출 (Gemini 환경 = 본 §10.3 수동 컨벤션 적용)

**금지 옵션**: `--no-verify`, `--force`, `--force-with-lease`, `main` 보호 브랜치 직접 푸시. 훅 실패 시 근본 원인 해결, 우회 금지.

푸시 직후 사용자에게 **커밋 SHA·메시지 요약·대상 브랜치** 보고.

### 4.4 시행령 24 — 개정 절차

> 원본: `fitly/.claude/decrees/24_amendment.md` (제42·44·45조)

#### 제42조 (개정 발의 5요소)

1. **현행 조항** — 인용
2. **제안 조항** — 신규·수정 후 문안
3. **개정 사유** — 1~3문장
4. **영향 범위** — 코드·문서·기능·UI 목록
5. **승인 요청** — "승인하시겠습니까?" 명시

#### 제44조 (점검 시점)

1. 새 모듈·기능 추가 요청
2. 기존 모듈·기능 cut/축소 검토
3. 기술 스택·라이브러리·외부 서비스 변경
4. Gemini·외부 자료·심사위원 의견이 헌법과 상충
5. 사용자가 "기존 결정과 다른 방향" 명시·시사
6. 새 위험·백업·금기 발견
7. 새 스킬 추가·작업 분류 확장

#### 제45조 (개정의 기록)
모든 개정은 **§8 (CHANGELOG)** 에 일자·버전·사유·승인자 기록. 누락 = 효력 없음.

### 4.5 시행령 25 — 헌법 근거 의무

> 원본: `fitly/.claude/decrees/25_constitutional_grounding.md` (제24조의2)

#### 제24조의2

1. **진행 상황 설명 시 헌법 조항 근거 함께 명시**. 근거 없는 보고 = 정식 보고 인정 X.
2. 코드·기획·결정 진행 전 헌법 조항 근거 자기 검토. 명확한 근거 없으면 보류.
3. 모든 결정 = 적어도 하나의 조항 근거.
4. 근거 모호·누락 = 제41조 개정 발의 우선.
5. 본 의무 = *결정의 사전 정당화 절차*.

---

## 5. 시행규칙층 (Rules 31~35) — 5개

### 5.1 시행규칙 31 — 스킬 활용 매핑 (Claude 환경)

> 원본: `fitly/.claude/rules/31_skill_mapping.md` (제25·26조)
> **Gemini CLI 환경에서는 §10.1 의 대체 가이드 참조**.

#### 제25조 (작업별 우선 호출 스킬 — Claude Code)

| 작업 분류 | Claude 스킬 |
|---|---|
| 사이드바·데시보드 위젯 / React 패턴 | `senior-frontend`, `react-best-practices`, `ui-design-system` |
| 화면 와이어프레임·UX 설계 | `ui-ux-pro-max`, `frontend-design`, `canvas-design` |
| 디자인 토큰·다크 모드 | `ui-design-system`, `senior-frontend` |
| 차트·그래프(Recharts) | `senior-frontend`, `ui-design-system` |
| Supabase + RAG + API Routes | `senior-backend`, `senior-fullstack` |
| 기출 PDF 파싱 / OCR / 시드 적재 | **`pdf-processing-pro`**, `senior-backend` |
| 팟캐스트 (Gemini multi-speaker TTS) | `senior-prompt-engineer`, `senior-backend` |
| Claude/LLM 프롬프트 설계 | `senior-prompt-engineer` |
| Progress 공식·아키텍처 검토 | `code-reviewer`, `senior-architect` |
| 일반 코드 리뷰 | `code-reviewer`, `senior-architect` |
| 외부 데모 (Cloudflare Tunnel) | `senior-security`, `progressive-web-app` |
| 발표용 docx 출력 | `docx` |
| `kice_pdfs/` 정리 | `file-organizer` |
| 커밋 메시지 | `git-commit-helper` |
| 보안 점검 | `senior-security` |
| MCP 서버 작성 | `mcp-builder` |
| 신규 기능 아이디어 발산 | `brainstorming` |
| 외부 노출 카피 / SEO | `seo-optimizer` |
| E2E·통합 테스트 | `webapp-testing` |
| PWA / 서비스워커 | `progressive-web-app` |
| 새 스킬 제작 | `skill-creator` |

#### 제26조

1. 스킬은 *작업 분류 일치 시*에만 호출.
2. 스킬 결과가 헌법과 충돌하면 **헌법 우선**.

### 5.2 시행규칙 32 — 절대 금기

> 원본: `fitly/.claude/rules/32_taboos.md` (제31·32·33·34조)

#### 제31조 (촌스러운 작명 금지)
1. "디데이", "D-day", "벼락치기", "족보", "한방 합격", "찐기출" 류 정식 명칭·UI 사용 금지.
2. 표준 = `Fitly`, `Progress 점수`, `학습 진척도`.

#### 제32조 (족보·실명 데이터 금지)
1. 특정 교수·강사·학원의 *비공개* 출제 패턴 자료 시드 인덱싱 금지.
2. 사용자 인터뷰 합격생 점수 = **익명화** + 평균 산출.

#### 제33조 (벼락치기 프레임 금지)
1. UI·홍보·발표에 학습 윤리 위배 인상 표현 ("벼락치기 캡슐", "마지막 7일 몰빵") 금지.
2. 표준 = **"학습 적합도 향상"**, **"D-day 대비 학습"**.

#### 제34조 (스코프 폭주 금지 — v3.6.4 개정 · 2026-05-15)

1. 사용자 요청이 **모호한 경우** 새 기능 미추가 — 기존 3탭·핵심 모듈 다듬기로 해석.
2. 사용자(주관자)가 **명시적으로 신규 기능 요청** 시 본 조항 미적용 (헌법 §16 v3.6.4 정합).
3. AI 자가 판단·추론 신규 기능 추가 금지.

### 5.3 시행규칙 33 — 위험·백업·장애 응답

> 원본: `fitly/.claude/rules/33_failure_response.md` (제35·35의2·36·37조)

#### 제35조 (백업 플랜) [v3.0 갱신]

| 위험 | 백업 |
|---|---|
| Gemini PDF OCR 실패 (표·이미지 보존 어려움) | 운영자 텍스트 입력 + 부분 자동화 |
| Gemini multi-speaker TTS 가용성 변동 | 단일 화자 + UI 안내 |
| AI 모범답안 품질 저하 | `verified: false` 배지 + 사용자 신고 + 운영자 검토 큐 |
| Supabase Free 한도 초과 | Pro($25/월) 즉시 업그레이드 |
| ts-fsrs 통합 버그 | Leitner 5박스로 폴백 |
| 시드 검토 부담 폭주 | Phase 1 풀이 카드 검토 우선, 키워드는 자동 신뢰 |

#### 제35조의2 (시드 파이프라인 추가 위험) [v3.5 신설]

| 위험 | 백업 |
|---|---|
| 2001학년도 이전 PDF 폰트 손상 | 시드 제외. 2002학년도부터 시작 |
| 특정 학년도 unpdf 부분 실패 | pdftocairo PNG → Gemini Vision OCR 폴백 |
| LLM 태그 폭주 | rules/35 제25조의2 태그 상한 정책 적용 |
| DB 마이그레이션 미적용 / 일시 장애 | `lib/db/queries.ts`의 `safeRun` 그래스풀 디그레이드 |

#### 제36조 (시간 부족 시 우선순위 — v3.0)

3주 일정 위협 시:
1. **시드 파이프라인** — 토대, cut 금지
2. **기출분석 페이지** (히트맵 3종 + 토픽맵 + 로드맵)
3. **풀이 페이지 + 자가 채점**
4. **학습 페이지** (3 트랙 SRS)
5. **팟캐스트** (TTS 어려우면 Phase 2)
6. **대시보드 + 학습계획 + 마이**
7. 그 외 (오답·학습분석) — Phase 2

#### 제37조 (장애 시 사용자 보고)
빌드 실패·API 키 누락·데이터 결측 등 차단 요소 발생 시 **즉시 보고**. 알리지 않고 임의 우회 시도 금지.

### 5.4 시행규칙 34 — 메타 문서 (위계 + 토론 이력)

> 원본: `fitly/.claude/rules/34_meta_documents.md` (제38·39조)

#### 제38조 (참조 문서의 위계 — v3.4 4계층)

1. 본 헌법 (§1~§5)
2. `.claude/laws/` 법률층
3. `.claude/decrees/` 시행령층
4. `.claude/rules/` 시행규칙층 (본 문서 포함)
5. `fitly/DESIGN.md` — 디자인 시스템 (법률층 동급)
6. `fitly/docs/plans/2026-05-06-fitly-v3-임용-design.md` — v3.0 컨셉 피벗 디자인
7. **사용자 즉시 발화** — 별도 우선 명시 시 본 헌법보다 우선

#### 제39조 (이전 Gemini 토론 이력의 효력)
v2.x 기간의 Gemini ↔ Claude 토론(편입 영어 컨셉)은 **v3.0 컨셉 피벗 시점에 해석 자료로서 효력 종료**. 이후 토론 합의 = *해석 자료*, 합의 뒤집기는 새 토론 라운드 또는 사용자 승인 필요.

### 5.5 시행규칙 35 — 시드 LLM 태그 상한 정책

> 원본: `fitly/.claude/rules/35_seed_tagging.md` (제25조의2, v3.5 신설)

#### 제25조의2

1. **태그 상한 = 5개** (한 문항당 — 영역·인지수준·형식·키워드 통합).
2. **우선순위** (높음 → 낮음):
   1. 영역(`domains`) — 11과목 + 교육학 (필수)
   2. 인지수준(`bloom`) — 기억·이해·적용·분석·평가·창작 (필수)
   3. 문항형식(`format`) — 객관식·단답형·서술형·논술형 (필수)
   4. 키워드(`keywords`) — 최대 2개 (보조)
   5. (선택) 단원 — 영역 하위 (있으면 키워드 슬롯 1개와 교환)
3. 5개 초과 시 *낮은 우선순위부터 제거*.
4. system prompt 에 본 규칙 *명시 인용* (헌법 §24의2 — 헌법 근거 의무).
5. 5개 초과 보존 필요 시 사용자 승인 후 본 시행규칙 개정 (제42조).

**적용 시점**:
- step03 (분류·태깅) system prompt 에 본 조항 인용 추가.
- step03 산출 JSON validator 에서 태그 카운트 검증 (≤ 5).
- 검증 실패 시 LLM 재요청 또는 운영자 검토 큐.

---

## 6. 디자인 시스템 (DESIGN.md 본문)

> 원본: `fitly/DESIGN.md` v3.0.1
> 본 §6 은 Gemini CLI 단일 로드를 위한 인라인 복사. 원본도 그대로 유지.

### 6.0 메모러블 앵커 (변경 금지)

> **공책 가로 괘선 + 세리프 헤드라인 + 학습 진척도만 컬러로 빛난다.**

본 앵커가 이후 모든 디자인 선택의 시험지이다 — 임의의 폰트·색·레이아웃이 본 앵커를 *돕는가* 아니면 *거스르는가*. 거스르면 채택하지 아니한다.

### 6.1 제품 컨텍스트

| 축 | 정의 |
|---|---|
| **무엇** | 한국 초등교사 임용시험(1차) 학습 플래너 PWA + NotebookLM 스타일 팟캐스트 |
| **누구** | 사설 학원·인강을 끊을 수 없는 환경의 임용 준비생 |
| **공간** | 태블릿 가로(1024×768) PWA · 데스크톱 · **모바일 1차** (v3.5.3) |
| **포지셔닝** | "정직한 플래너, 마법 아님" (헌법 §3의2) |
| **방어 미학** | 사설 인강 광고(다색·과대 카피·긴급성)의 시각적 정반대 |
| **데이터 자산** | 24년치 국가공식 임용 기출 (2002~2026) 시드 + 영역·인지수준·문항형식·키워드 태깅 |

### 6.2 미학 방향

- **방향**: "공부 노트 + 학술서"
- **분위기**: 도서관·대학 강의노트·19세기 학술 출판물의 차분한 권위감
- **장식 수준**: Intentional — 가로 괘선 + 미세 종이 그레인 (1% 노이즈)
- **금지 장식**: 그라디언트, 블롭, 아이콘 서클, 데코 일러스트, 풀 컬러 밴드

### 6.3 타이포그래피

| 역할 | 영문 | 한글 | 비고 |
|---|---|---|---|
| Display·Hero | **Newsreader** | **Noto Serif KR** | 따뜻한 모던 세리프 |
| 본문·UI | **Geist** | **Pretendard** | 깨끗한 그로테스크 |
| 데이터·표 | Geist (`tnum 1`) | Pretendard (`tnum 1`) | tabular-nums |
| 코드 | **JetBrains Mono** | — | 희소 사용 |

**스케일**:

| 용도 | Size | LH | Letter-spacing |
|---|---|---|---|
| Display | `clamp(3.5rem, 7vw, 5.5rem)` | 0.95 | -0.025em |
| H1 | 2.25rem (36px) | 1.2 | -0.015em |
| H2 | 1.875rem (30px) | 1.3 | -0.01em |
| H3 (Panel title) | 1.25rem (20px) | 1.35 | -0.005em |
| Body 한글 | 1rem (16px) | **1.7** | 0 |
| Body 영문 | 1rem (16px) | **1.6** | 0 |
| Small | 0.875rem (14px) | 1.5 | 0 |
| Micro (eyebrow) | 0.75rem (12px) | 1.5 | **0.12em uppercase** |

**폰트 스택 변수**:
```css
--font-serif-en: "Newsreader", "Noto Serif KR", Georgia, serif;
--font-serif-kr: "Noto Serif KR", "Newsreader", Georgia, serif;
--font-sans-en: "Geist", "Pretendard", -apple-system, sans-serif;
--font-sans-kr: "Pretendard", "Geist", -apple-system, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

**사용 규칙**:
1. **헤드라인·KPI 큰 숫자·인사말은 세리프**, 본문·라벨·버튼·표는 sans.
2. **숫자가 동일 컬럼에 정렬되는 위치는 모두 `tabular-nums`**.
3. **Newsreader italic** = 강조·"맞게(Fit)" 펀치라인 키워드, AI "F" 아이콘.
4. 한글+영문 혼용 시 `font-feature-settings: "ss01"` 등은 Pretendard 만.

**절대 금지 폰트**: Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, Comic Sans, Papyrus, Bradley Hand, Brush Script, Impact.

### 6.4 색 (Color)

#### 6.4.1 라이트 모드

| Token | Hex | 용도 |
|---|---|---|
| `--color-bg` | `#FAF6EE` | 페이지 배경 (warm cream paper) |
| `--color-surface` | `#FFFAF1` | 카드·패널 표면 |
| `--color-surface-deep` | `#F3EDE0` | 입력 등 깊은 표면 |
| `--color-text` | `#1A2027` | 본문 (deep ink) |
| `--color-text-muted` | `#6B6256` | 보조 (warm gray) |
| `--color-rule` | `#E8E2D5` | 괘선·구분선 |
| `--color-rule-strong` | `#C8BFA8` | 입력 보더 |
| `--color-accent` | `#1F5C4A` | **Progress·CTA 전용** (deep evergreen) |
| `--color-accent-strong` | `#173F33` | accent hover |
| `--color-accent-soft` | `rgba(31, 92, 74, 0.1)` | accent 카드 배경 |
| `--color-warning` | `#B5862D` | desaturated mustard |
| `--color-error` | `#A03B2D` | desaturated rust |
| `--color-info` | `#2E4A6B` | desaturated navy |

#### 6.4.2 다크 모드

| Token | Hex |
|---|---|
| `--color-bg` | `#11151B` |
| `--color-surface` | `#1A2027` |
| `--color-surface-deep` | `#232A33` |
| `--color-text` | `#F5EFE3` |
| `--color-text-muted` | `#948A7A` |
| `--color-rule` | `#2A323E` |
| `--color-rule-strong` | `#3D4654` |
| `--color-accent` | `#2D8B6F` |
| `--color-accent-strong` | `#46A98A` |
| `--color-accent-soft` | `rgba(45, 139, 111, 0.15)` |
| `--color-warning` | `#E0B458` |
| `--color-error` | `#D1685A` |
| `--color-info` | `#6088B5` |

#### 6.4.3 액센트 사용 규칙 (위반 절대 금지)

`--color-accent` 는 *오직* 6곳:

1. **Progress 게이지 채움** — KPI 카드 진척 바, 차트 라인·점, 큰 숫자
2. **오늘의 1차 액션 버튼** — primary CTA
3. **+N% 델타 숫자** — 증가형 변화
4. **활성 사이드바 메뉴 항목**
5. **AI 추천 카드 강조** — 보더, "F" 아이콘 배경
6. **로그인/회원가입 랜딩 hero 잉크 trail** (v3.6 추가)

그 외 일체 — 헤드라인·카드 보더·체크박스·일반 아이콘·배지·링크 — *절대 등장 X*.

#### 6.4.4 시맨틱 컬러 운영

`warning · error · info` = 의도적 낮은 채도. 차별화는 **(라벨 + 아이콘 + 좌측 보더 3px)** 3축.

**§4.4.1 영역(domain) 분류 단서 (v3.5.4)**: 좌측 보더 *hue* 만 영역 분류 다색 허용. 토큰: `--subject-1` ~ `--subject-7`. 8과목 이상 modulo 순환. 낮은 채도 (S ≤ 35%). evergreen·gold 본연 hue 제외.

#### 6.4.5 종이 그레인

```css
background-image: radial-gradient(circle at 1px 1px, rgba(26,32,39,0.018) 1px, transparent 0);
background-size: 4px 4px;
```

다크: `rgba(255,255,255,0.012)`.

### 6.5 여백 (Spacing)

베이스: **4px**.

| Token | Value |
|---|---|
| `--space-2xs` | 2px |
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 12px |
| `--space-lg` | 16px |
| `--space-xl` | 24px |
| `--space-2xl` | 32px |
| `--space-3xl` | 48px |
| `--space-4xl` | 64px |

**표준 적용**:
- 카드 패딩: `--space-xl` (24px)
- 섹션 간 간격: `--space-2xl` (32px)
- 페이지 여백 (태블릿): `--space-3xl` (48px)
- 사이드바 항목 간 간격: `--space-2xs` (2px)

**밀도 정책**: 중간 밀도 — Notion 보다 살짝 여유롭고 Sunsama 보다 빠듯한 사이.

### 6.6 레이아웃

#### 6.6.1 그리드
- 사이드바: **240px → 188px (v3.5.2)** 고정 폭
- 우측 콘텐츠: 12-col grid
- **최대 콘텐츠 너비**: 1280px
- 태블릿 가로 1024×768 기준 디자인, 데스크톱 자연 확장, 모바일 폴드백

#### 6.6.2 보더 라디우스
| Token | Value | 용도 |
|---|---|---|
| `--radius-sm` | 4px | 체크박스, 작은 배지 |
| `--radius-md` | 8px | 카드, 버튼, 입력 |
| `--radius-lg` | 12px | 모달, 큰 패널 |
| `--radius-pill` | 999px | 토글, 진척 바 |

#### 6.6.3 가로 괘선 (노트 메타포)
`--color-rule` 1px 두께, **콘텐츠 블록 간 구분에만** (카드 사이 X, 섹션 사이).

#### 6.6.4 그림자
| Token | 용도 |
|---|---|
| `--shadow-1` | 카드 hover (subtle lift) |
| `--shadow-2` | 모달, 모의 디바이스 프레임 |

다크 모드 = 알파 채널 0.3-0.4 강화.

### 6.7 모션 (Motion)

| 종류 | Easing | Duration |
|---|---|---|
| 진입 | ease-out | 200ms |
| 퇴장 | ease-in | 150ms |
| 이동 | ease-in-out | 250ms |

페이드, 미세 슬라이드 (8px 이하), 보더 컬러 transition 만 사용.

**포커스 링** (모든 입력 일관):
```css
box-shadow: 0 0 0 3px var(--color-accent-soft);
border-color: var(--color-accent);
```

#### 6.7.1 Progress 점수 상승 애니메이션 (헌법 §8 도파민 트리거)
- 진척 바 채움: **700ms ease-out**
- 숫자 카운트업: 50ms 마다 1씩 증가 (총 500-1000ms)

이 외 표현적 모션 X — *절제가 시그니처*.

### 6.8 컴포넌트 결정

#### 6.8.1 Button

| 변형 | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| Primary | `--color-accent` | `#FFFAF1` | none |
| Secondary | `--color-surface` | `--color-text` | `--color-rule-strong` |
| Ghost | transparent | `--color-text` | none |

Primary hover → `--color-accent-strong`. 패딩: 12px 24px. Border-radius: `--radius-md`.

#### 6.8.2 KPI Card

```
┌─────────────────────┐
│ 라벨 (sans 0.8125)  │
│                     │
│ 72 (serif 2.5rem)   │  ← Progress KPI 만 accent
│ /100 (sans muted)   │
│                     │
│ 어휘 80 · 오답 65   │
│ ▓▓▓▓▓▓▓░░░░░░░     │  ← Progress 바, accent
└─────────────────────┘
```

#### 6.8.3 Form Input
- 보더 1px `--color-rule-strong`
- 배경 `--color-bg` (cream)
- 라벨 0.8125rem `--color-text-muted`, 입력 위
- 포커스: 보더 → `--color-accent`, 박스 섀도 3px `--color-accent-soft`

#### 6.8.4 Alert
배경 `--color-surface-deep`, 텍스트 `--color-text`. 시맨틱 색은 좌측 보더 3px 에만.

#### 6.8.5 AI Recommend Card
- 보더 1px `--color-accent`, 배경 `--color-accent-soft`
- 좌측 32px 원형 "F" 아이콘
- 화면당 보통 1개만 (§4.3 5번)

#### 6.8.6 Plan Row
체크 accent + 텍스트 line-through muted (done). 미완 = 보더 rule-strong. 행 간 = `--color-rule` 1px 하단 보더.

#### 6.8.7 Sidebar Nav Item
- 비활성: `--color-text-muted`, hover `--color-surface-deep`
- 활성: `--color-accent-soft` 배경 + `--color-accent` 텍스트 + 가중치 500
- 패딩 12px, border-radius `--radius-md`
- 아이콘 16px + 라벨 0.9375rem

### 6.9 콘텐츠 가이드

#### 6.9.1 어조
- **UI 학습자 호칭**: **"{사용자명} 선생님"** 고정. 인사말: `안녕하세요, {displayName} 선생님.` fallback `안녕하세요, 선생님.`. 마이 fallback `Fitly 선생님`.
- 헌법 §0 의 "주인님"(AI ↔ 주관자 대화)과 분리. UI 학습자 호칭 = "선생님".
- **존댓말** 모든 시스템 메시지·알림·CTA·empty state.
- 화면 라벨: 간결한 명사형 ("학습 진척도", "오늘의 학습 플랜")
- AI 추천 본문: 제안형 ("...해드릴까요?"), 단정형·강제형 금지
- 알림: 사실 + 영향 (예: "학습 진척도가 +3 올랐습니다. 어제 69 → 오늘 72.")
- **동기부여 카피 (v3.5.3)**: 펀치라인 *"적합도"* 톤 유지. 강제·재촉 인상 금지. "달려볼까요?" 게임풍 표현 X.

#### 6.9.2 숫자 표기
- 모든 학습 데이터 = `font-variant-numeric: tabular-nums`
- 단위는 한글, 숫자 뒤 작은 폰트로 분리
- 예: `72/100`, `1시간 24분`, `8일째`, `D-87`

#### 6.9.3 마이크로카피 절대 금지

```
합격 가능성 · 합격 확률 · 점수 예측 · 지역 핏 · 교육청 핏 ·
지역 적합도 · 임용 컷 · 합격선 · 절대 평가 · 추정 컷 ·
디데이 · 벼락치기 · 족보 · 한방 합격 · 찐기출
```

정식 표현 = **"학습 진척도", "Progress 점수"** 두 가지만.

#### 6.9.4 시드 데이터 라벨
- 출처: `2024학년도 교직논술 1번` 형식
- 검증 상태: `verified: true | false` 배지
- 생성 방식: AI 모범답안·키워드·팟캐스트는 `AI 생성` 보조 라벨

### 6.10 반응형·접근성

#### 6.10.1 브레이크포인트 (post 2026-05-18 단순화)

| 이름 | 폭 | 적용 |
|---|---|---|
| Mobile | <768px | 햄버거 + drawer, 단일 컬럼, sticky 상단바 |
| Tablet 세로 | 768~1023px | 햄버거 + drawer, 2 컬럼 일부 |
| Tablet 가로 (기본) | 1024~1279px | 사이드바 188px 고정 + 콘텐츠 (lg:) |
| Desktop | 1280px+ | 사이드바 + 자연 스크롤 (콘텐츠 우선) |

> **2026-05-18**: viewport-fit (`xl:h-screen + overflow-hidden + flex-1`) 패턴이 zoom·F11 변화 시 fragile 회귀를 5번 반복 발생시켜 **PR #102 에서 dashboard 완전 제거**. me/study-plan 페이지에는 잔존 — 필요 시 동일 패턴으로 제거 권장.

#### 6.10.2 접근성

- **명도 대비**: WCAG AA (4.5:1) 이상. `--color-text` on `--color-bg` ≈ 12.8:1.
- **포커스 링**: 모든 입력 일관 3px `--color-accent-soft` + 보더 `--color-accent`
- **선호 모션 감소**: `prefers-reduced-motion: reduce` 시 진척 카운트업 즉시 종료, 페이드만 유지
- **선호 컬러 스킴**: `prefers-color-scheme: dark` 자동 감지 + 사용자 토글 우선

### 6.11 SAFE / RISK 의도

#### 6.11.1 SAFE (의도적 보존)
1. 사이드바 + 우측 카드 그리드
2. tabular-nums 정렬 데이터
3. 라이트/다크 양 모드

#### 6.11.2 RISK (의도적 차별화)
1. **앱 *안* 헤드라인까지 세리프** — Sunsama 등 경쟁자는 마케팅에만, 앱은 sans. Fitly 는 KPI 라벨까지 세리프.
2. **단일 액센트 `#1F5C4A` — 진척에만** — 경쟁자 2-4 액센트. "녹색 = 내 진척" 즉각 학습.
3. **콘텐츠 블록 사이 가로 괘선** — SaaS 거의 안 함. "아, 학습 노트" 인지.

---

## 7. 시드 LLM 4계층 하네스

> 원본: `fitly/docs/harness/seed-llm-prompts.md` (2026-05-06 신설)

### 7.1 4계층 system prompt 표준

모든 시드 LLM 호출은 다음 4계층을 시스템 프롬프트로 주입. 호출 종류에 따라 *법률층 이하만* 갈아끼우고 헌법층은 *불변 고정*.

#### 7.1.1 헌법층 (불변)

```
[헌법 — 절대 원칙]
1. 시험 문제 본문(stem)은 KICE 공식 PDF 원본만 사용한다. LLM은 본문을 생성·요약·재구성·교정하지 아니한다 (헌법 v3.3 9항).
2. 외부 학원·교재 해설을 직접 인용하지 아니한다 (제27조).
3. AI 생성물은 모두 verified_answer=false 라벨로 시작한다 (제18조의2).
4. 출처 4계층 모델 준수: official / ai_estimate / user_self_corrected / crowd_verified (제30조의2).
5. 태그 합계 ≤ 5 — 영역·Bloom·형식 필수 3 + 키워드 최대 2 (시행규칙 35 제25조의2).
6. 응답은 JSON으로만, 코드펜스·머리말·해설 금지.
```

#### 7.1.2 법률층 (도메인 enum)

```
[법률 — 도메인 enum]
- 영역(domain): 국어·수학·사회·과학·영어·도덕·실과·체육·음악·미술·통합교과·교육학 (12개)
- 인지수준(bloom): 기억·이해·적용·분석·평가·창작 (6개)
- 문항형식(format): 단답형·서술형·논술형·객관식 (4개)
- 회차(session): essay·A·B·combined (4개)
- 연도(year): 2001~2026 (정수)
```

#### 7.1.3 시행령층 (운영 절차)

```
[시행령 — 운영 절차]
- 호출 순서: Step 03 분리 → Step 04a 태깅 → Step 04b 키워드 (이전 출력이 다음 입력의 변별자극, R002 행동연쇄)
- 검증 절차: 각 호출 후 schema 자가검증 → 실패 시 verified=false + 운영자 검토 큐
- 비용 게이트: 5 PDF dry-run 실측 후 본실행 (헌법 v3.1 §7)
- 실패 시 폴백: stem_text 빈 문자열 + stem_image_path PNG 보장 (PDF 폰트 손상 시)
```

### 7.2 Step 03 — 문항 분리 (Least-to-Most + ReAct)

```
[시행규칙 — Step 03 문항 분리]
당신은 한국 초등교사 임용시험 문제지의 문항 경계를 식별하는 어시스턴트입니다.

분해 절차 (Least-to-Most, R002 정합):
1. 페이지 경계 먼저 식별 (LLM 추론 부하 최소)
2. 각 페이지 안의 문항 번호 패턴 (1., 2., ㉠㉡㉢, 〔A〕 등) 식별
3. 문항 시작·종료 offset만 보고 (본문 텍스트는 unpdf가 보장하므로 LLM이 재생성 금지)

ReAct 트레이스 (각 문항마다):
- Thought: 문항 N의 시작 패턴은 무엇인가?
- Act: stem_offset_start, stem_offset_end 정수 출력
- Observation: 페이지 글자수와 일치하는가? (검증 규칙 자가체크)

출력 JSON:
[
  { "item_no": 1,
    "stem_pages": [1, 2],
    "stem_offset_start": 93,
    "stem_offset_end": 1692,
    "format_hint": "논술형" },
  ...
]
```

**Few-shot fading**: 20개 PDF 처리 후 예시 수 3 → 1 → 0 단계적 축소 (R002 fading).

### 7.3 Step 04a — 태깅 + 모범답안 (Self-Refine)

```
[시행규칙 — Step 04a 서술형 태깅]
당신은 한국 초등교사 임용시험 분석 전문가입니다.

분해 절차:
- 호출 1: 영역 분류만 (12 enum 안에서)
- 호출 2: Bloom 인지수준만 (6 enum 안에서)
- 호출 3: 키워드 *최대 2개* (영역·Bloom·형식과 합산하여 총 태그 5개 이하 — 시행규칙 35 제25조의2 정합)
- 호출 4: 모범답안 초안 작성

Self-Refine 루프 (모범답안 한정, R002 정합):
- 1차: 본문 근거로 모범답안 4~8문단 작성
- 2차 자체 평가:
  · 외부 학원 해설을 직접 인용했는가? (헌법 제27조)
  · 본문 외 정보를 단정 인용했는가? (헌법 제30조)
  · 길이 200자 이상인가?
  · 학술적 어휘를 사용했는가?
- 3차: 평가 결과 반영하여 재작성

출력 JSON: { "domains": [...], "bloom": "...", "keywords": [...], "answer_md": "..." }
```

### 7.4 Step 04b — 키워드 dedup + 개념 노트

```
[시행규칙 — Step 04b 키워드 개념 노트]
당신은 한국 초등교사 임용시험 키워드 큐레이터입니다.

분해 절차 (헌법 v3.2 8항 정합):
- 객관식 시대(2002~2013) 문항 분석 → 핵심 개념 추출 → KeywordCard 본문 흡수
- 객관식 문항을 풀이 카드로 출제하지 아니한다.

KeywordCard 본문 표준 구조 (헌법 v3.2 정합):
1. 정의·요지 (1~3문장)
2. 핵심 요소 (2~5개 bullet)
3. 관련 출제 이력 (좌표 + 묻는 방식: "정의 묻기" / "적용 묻기" / "분석 묻기")
4. 함께 보는 키워드 (인접 키워드 2~5개)

5±2 인지 부하 한계 준수 (R002 H4 정합): 4구성요소가 적정, 5+ 강제 금지.

출력 JSON: { "keyword": "...", "definition": "...", "key_elements": [...], "occurrences": [...], "related": [...] }
```

### 7.5 Observer IOA 메트릭

```
[시행령 — observer IOA]
시드 단계에서 LLM의 다중 호출을 임시 crowd로 대체:
- 동일 문항을 Gemini Flash로 2회 호출
- 태깅 일치도(IOA) 측정: domains·bloom·keywords의 set 일치 비율
- IOA < 80% 항목을 검토 큐 상단으로 우선 노출 (헌법 제30조의2 준영역)
```

### 7.6 헌법 정합 체크리스트

- [x] v3.3 9항: 본문 LLM 생성 금지 → §7.1.1 헌법층 1번
- [x] 제18조의2: 검증 라벨 → §7.1.1 3번
- [x] 제27조: 외부 학원 인용 금지 → §7.1.1 + §7.3 Self-Refine
- [x] 제30조: 본문 근거 추론 → §7.3 Self-Refine
- [x] 제30조의2: 4계층 출처 → §7.1.1 4번
- [x] v3.2 8항: 객관식 → 키워드 흡수 → §7.4
- [x] 제18조 v3.1 매트릭스: Pro / Flash / Sonnet 분기 → §7 적용 가이드
- [x] R002 H1·H2: 분해·fading·자기관리 → §7.2~7.4 절차
- [x] R004 H1·H4: 4계층 위계 명시 + 자기집행성 → §7 전체

---

## 8. 헌법 개정 이력 (CHANGELOG)

> 원본: `fitly/.claude/CHANGELOG.md`

| 일자 | 버전 | 변경 요약 | 승인 |
|---|---|---|---|
| 2026-05-01 | v1.0 | 헌법 제정 | 사용자 |
| 2026-05-01 | v1.1 | 개정 발의 절차 (제41~45조) + 헌법 근거 의무 (제24조의2) | 사용자 |
| 2026-05-01 | v1.2 | 제25조 스킬 매핑에 `progressive-web-app` 추가 | 사용자 |
| 2026-05-01 | v1.3 | 제24조의3 (검증 운영 기준) + 제24조의4 (자동 푸시 + git-commit-helper) | 사용자 |
| 2026-05-01 | v1.4 | 제0조 "주인님" + 존댓말 + 제18조 Anthropic → Gemini 단일 공급자 | 사용자 |
| 2026-05-01 | v1.5 | 제18조 — 성능 최우선 정책 (gemini-3.1-pro-preview / embedding-2) | 사용자 |
| 2026-05-01 | v1.6 | 제13조의2 — 학습 카드 3종 분류 (Mistake/Study/Vocab) | 사용자 |
| 2026-05-01 | v1.7 | 제18조의2 (검증 라벨) + 제30조의2 (3계층 출처) | 사용자 |
| 2026-05-04 | v1.8 | 코드 리뷰 D17 후속 4건 (SW `/api/*` 캐시 금지, RLS 코드 강제, RAG 일반 빈출 한정, 4계층 출처 `user_self_corrected` 추가) | 사용자 |
| 2026-05-04 | v1.9 | D18 데시보드 피벗 — Gemini R3 합의 4건 (모바일 3탭 → 태블릿 가로 사이드바, 시연 디바이스 태블릿, 사이드바 7개 재구성, 카드 노출 매핑) | 사용자 |
| 2026-05-04 | v1.10 | 정합성·매핑 정정 일괄 | 사용자 |
| 2026-05-05 | v1.11 | 제13조의2 study_cards 정식 분리 | 사용자 |
| 2026-05-05 | v2.0 | **컨셉 피벗 — "학습 적합도" → "학습 플래너"** + 제3조의2 정직성 신설 + Fit 공식 폐지 / Progress 점수 신설 | 사용자 |
| 2026-05-05 | v2.1 | **디자인 시스템 신설 — DESIGN.md** + 제16조의2 (단일 SoT) | 사용자 |
| 2026-05-06 | v3.0 | **컨셉 피벗 — "편입 영어" → "초등 임용 1차 + 팟캐스트"**. 9건 일괄 + 사이드바 재편 + 카드 3종 (Quiz/Keyword/Mistake) + 팟캐스트 episode 모델 + 지역 교육청 17개 | 사용자 |
| 2026-05-06 | v3.0.1 | **자료 페이지 cut** — 사용자 PDF 업로드 폐기 | 사용자 |
| 2026-05-06 | v3.1 | 제18조 매트릭스 전면 개정 — 기능별 차등 (Pro/Flash/Sonnet 1M) + 5 PDF dry-run 게이트 | 사용자 |
| 2026-05-06 | v3.2 | 객관식 시대(2002~2013) → 풀이 카드 X, KeywordCard 흡수 | 사용자 |
| 2026-05-06 | v3.3 | **시험 문제 본문 100% 정확성 보장** — `stem_text` (unpdf) + `stem_image_path` (pdftocairo), LLM 본문 생성 금지 | 사용자 |
| 2026-05-06 | v3.4 | **4계층 규범위계 물리 분리** — R004 정합. `.claude/{laws,decrees,rules}/` 분산. CLAUDE.md 80줄 인덱스화 | 사용자 |
| 2026-05-06 | v3.5 | omnibus 7건 — 제1조(명칭) + 제3조(사명) + 부칙 신설 + 제18조의3 (객관식 연도 범위) + 제19조의2 (points integer) + 제35조의2 (시드 백업) + 제25조의2 (시드 LLM 태그 상한) | 사용자 |
| 2026-05-12 | v3.5.1 | 펀치라인 개정 — **"합격은 시간이 아니라 적합도다."** + 제4조의3 (한글 줄바꿈 원칙) | 사용자 |
| 2026-05-12 | v3.5.3 | 외부 UI/UX 평가 omnibus — 제2조 모바일 1차 격상 + 제16조 외부 평가 단서 + TabletGate 제거 | 사용자 |
| 2026-05-13 | v3.5.6 | 외부 평가 sweep — 잔존 보강 3건 + NoChange 3건 결정 기록 | 사용자 |
| 2026-05-13 | v3.6 | 외부 평가 75건 omnibus sweep — §4.3 AI 추천 보더 + §7 모션 단서 + §16 인터랙션 다듬기 | 사용자 |
| 2026-05-14 | v3.6.1 | AI 학습 도우미 (FAB + multi-turn 챗봇) + §18 매트릭스 — gemini-3.0-flash | 사용자 (PR #44) |
| 2026-05-14 | v3.6.2 | LlmFailed 사고 수습 — 안정 세대 (2.5-pro/flash) 복원 + 7개 매핑 명세 등재 | 사용자 |
| 2026-05-14 | v3.6.3 | 학습 본업 전 Flash 통일 (속도 우선) + AssistantFab 우측 하단 + 마크다운 마크업 3중 방어 | 사용자 |
| 2026-05-15 | v3.6.4 | **§16 + §34 전면 개정** — "신규 기능 추가 금지" 조항 해소. 사용자 명시 요청 시 즉시 추가 | 사용자 (발화) |

### 8.1 2026-05-17~18 누적 PR (헌법 외 인프라/UX 회귀 정리)

| PR | 일자 | 변경 |
|---|---|---|
| #92 | 05-17 | viewport-fit 임계점 xl→2xl 상향 (1366×768 노트북 카드 겹침) |
| #93 | 05-17 | hot 테이블 복합 인덱스 + me/page 중복 profile 쿼리 제거 (1분+ 로딩 / 로그아웃) |
| #94 | 05-17 | 마이그레이션 0002 CONCURRENTLY 제거 (Supabase SQL Editor 호환) |
| #95 | 05-17 | GEMINI_MODEL_FLASH 슬롯에 Pro Preview 박힌 회귀 + dead fallback 정리 |
| #96 | 05-17 | 빈 상태 카드 min-h floor (viewport-fit 미활성 구간 수축 회피) |
| #97 | 05-17 | dashboard 부모 컨테이너 grid → flex flex-col |
| #98 | 05-17 | row 1·2 컬럼 경계 정렬 — xl:grid-cols-3 col-span 2:1 (67%) |
| #99 | 05-17 | LearningTrend article + chart-div overflow-hidden (F11 SVG overflow) |
| #100 | 05-18 | 카카오 OAuth 제거 + Supabase auth 에러 한글 매핑 |
| #101 | 05-18 | 회원가입 → /login?signup=success 자동 redirect + 테스트 안내 |
| #102 | 05-18 | **viewport-fit 전면 제거** (dashboard) + OnboardingBanner X 닫기 |
| #103 | 05-18 | 회원가입 후 signOut → 로그인 페이지 강제 (자동 로그인 방지) |
| #104 | 05-18 | OnboardingBanner dismiss 키를 user.id 별로 분리 |
| #105 | 05-18 | GEMINI.md 인수인계서 신설 (Gemini CLI 환경) |
| #106 | 05-18 | root 파일 카테고리 정리 + GEMINI.md 부록 B 갱신 |
| #107 | 05-18 | **/cso + /review CRITICAL 5 + HIGH 10 일괄 해소** — gradeCard ts-fsrs 통합 + userCardLog INSERT + transaction 4건 + TOCTOU 3건 + Zod + essay 50/day cap + podcast per-line validation + disclaimer 서버 검증 + AbortController + queries.ts React.cache + seed §25의2 cap + 사이드바 풀이/학습 + §31 D-day 4 페이지 정정 |
| #108 | 05-18 | hotfix — /study redirect /study-plan → /study/quiz + 사이드바 active longest-prefix-match + 시험 카운트다운 칩 2단 (지역·시험일 / D-N) |

---

## 9. 현재 프로젝트 상태 (2026-05-18)

### 9.1 인프라

| 항목 | 값 |
|---|---|
| GitHub | `github.com/Cazeko/vibe2026-new` |
| Vercel | fitly project (Hobby plan) |
| Supabase URL | `adihnfvacezivlrfbfzp.supabase.co` |
| Supabase Region | `ap-northeast-2` (서울) |
| DB | Postgres 15 + pgvector, pooler port 6543 |
| Domain | (custom domain 또는 vercel.app 자동) |

### 9.2 환경 변수 (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://adihnfvacezivlrfbfzp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.adihnfvacezivlrfbfzp:...@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres

# Gemini
GEMINI_API_KEY=AIzaSyDp...
GEMINI_MODEL_PRO=gemini-2.5-pro       # 안정 세대 (v3.6.2)
GEMINI_MODEL_FLASH=gemini-2.5-flash   # 안정 세대 (v3.6.2)
GEMINI_EMBEDDING_MODEL=gemini-embedding-2

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_USER_IDS=<comma-separated UUIDs>

# Optional
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=
```

### 9.3 LLM 환경 (Gemini API)

- **API Key**: 보유 (`.env.local` 의 `GEMINI_API_KEY`)
- **권장 모델** (안정성 검증됨):
  - Pro: `gemini-2.5-pro`
  - Flash: `gemini-2.5-flash`
  - Embedding: `gemini-embedding-2`
- **⚠ 위험 사례**:
  - **Spend cap 도달**: 2026-05-17 모든 호출 429 RESOURCE_EXHAUSTED → https://ai.studio/spend 에서 확인·해제
  - **`gemini-3.x` preview 모델**: 환경/리전 미가용 위험 — fallback 으로 2.5 세대 보존 (v3.6.2 결정)
  - **Flash 슬롯에 Pro Preview 박힘**: 환경 변수 오설정 시 챗봇이 5~10초 응답 + Vercel 30s 한도 초과. PR #95 에서 fix.

### 9.4 데모 계정 + 시드

- **데모 계정**: `test@test.com` / `testtest` (홍길동)
- **시드 명령**: `npm run seed:demo`
- **시드 내용**: 180일 사용 이력, 약점 수학 42% / 영어 53%
- **시드 PR**: #85 (fe46a70)

### 9.5 핵심 컨벤션 (메모리에서 추출)

> Claude Code 의 메모리 시스템에 저장돼 있던 운영 규칙. Gemini CLI 환경에서도 동일 적용.

#### 9.5.1 호칭·어투
- 사용자(주관자) 호칭: **"주인님"**
- 모든 user-facing 텍스트: **존댓말**
- **반말·격식 없는 단언 절대 금지** — "전부 staged 되어버렸네", "깔끔.", "타입 OK" 류 평어체·명사 단언 금지 (2026-05-12 강하게 지적 받음)

#### 9.5.2 Git / GitHub
- **Author**: name = `Cazeko`, email = `cajeko0913@gmail.com`
- **Co-Authored-By 라인 일체 미포함** — Vercel Hobby plan 차단 회피 (2026-05-05 사고)
- 커밋 시 명령:
  ```bash
  git -c user.name=Cazeko -c user.email=cajeko0913@gmail.com commit -m "..."
  ```

#### 9.5.3 PAT (Personal Access Token)
- **같은 세션 내 PAT 재사용 OK** — "계속 푸시 해" 발화 (2026-05-12)
- 세션 경계에서는 신규 PAT 요청
- 현재 PAT 권한: Contents · Pull requests · Metadata · Deployments **Read**. Checks/Statuses/Actions 권한 없음 (fine-grained PAT 한계)

#### 9.5.4 자동 PR 머지 권한
- **부여됨** (2026-05-12 발화로 main 보호 위험 옵션 명시 승인 영구 면제)
- 조건: `mergeable + Vercel success` 시 자동 squash merge + 브랜치 정리

#### 9.5.5 Vercel 배포 폴링
- **올바른 엔드포인트**: `/repos/{owner}/{repo}/deployments?sha={sha}` → `/deployments/{id}/statuses`
- 잘못된 엔드포인트 (403 Forbidden): `/check-runs`, `/status`, `/actions/runs` — 다른 권한 필요
- Vercel = GitHub Deployments 로 보고

#### 9.5.6 파괴적 명령 전 백업
- `rm -rf`, `git reset --hard` 등 직전 **`cp -r` 또는 `git stash --include-untracked` 필수** (2026-05-05 untracked 파일 손실 사고)

#### 9.5.7 스코프 보호 완화 (v3.6.4)
- 주인님 명시 요청 시 신규 기능 즉시 추가
- §16 / §34 인용 거절·발의 절차 안내 금지 (2026-05-15 발화)

#### 9.5.8 디자인 작업 시 ui-ux-pro-max 스킬 (Claude) / DESIGN.md 우선 (Gemini)
- UI/UX 컴포넌트 배치·시각 위계·인터랙션 결정 시 매번 호출 (Claude)
- Gemini 환경 = 본 §6 + 원본 `fitly/DESIGN.md` 우선 참조 (§10.1 매핑)

### 9.5.9 보안 상태 (2026-05-18 /cso + /review 결과)

**보안 보고서**: `fitly/.gstack/security-reports/` (gitignored, 로컬 보존)
- `2026-05-18-170100.json` — /cso 보고서. CRITICAL 1·HIGH 1·권고 5
- `2026-05-18-171310-code-review.md` — /review 코드 리뷰 (5 specialist 종합)

**해소 완료** (PR #107·#108):
- §13 사이드바 풀이/학습 nav 정합 + active longest-prefix-match
- §19 ts-fsrs 통합 — `lib/srs/index.ts` 활성화 (placeholder 3 곳 제거)
- §25의2 시드 태그 cap 100% 위반 해소 — `scripts/seed/lib/system-prompts.mjs` 신설 + load 시점 cap
- §28 비용 가드 강화 — essay 50/day cap + podcast TOCTOU + transaction 4건 + AbortController
- §31 D-day 4 페이지 정정 (사이드바는 D-N 운영 예외)
- §3의2 정직성 — podcast disclaimer 서버 검증
- 학습 코어: `gradeCard` 가 `userCardLog` INSERT 시작 → 대시보드 plan progress 정상 작동
- React.cache, Zod schema, `requireUser` helper 신설

**미해소 / 후속 액션 필요** (주인님):
1. **🚨 CRITICAL — GitHub PAT 가 `.git/config` 평문 노출** (`/home/jovyan/work/.git/config`)
   - `git remote -v` 1줄로 추출 가능. fine-grained PAT (`github_pat_11...`).
   - 조치: GitHub Settings → Developer settings → PAT revoke → 새 PAT 발급 → `git remote set-url origin https://github.com/Cazeko/vibe2026-new.git` + credential helper 도입.
2. **`.github/workflows/ci.yml` push 보류** — 현재 PAT 에 `workflow` scope 없어 push 차단. 파일은 `/home/jovyan/work/.github/workflows/ci.yml` 보존. 새 PAT 발급 시 `Workflows: read+write` 권한 포함 → 별도 PR.
3. **GitHub Settings → Security → Dependabot alerts 활성** (UI 클릭 1회, 30초). CodeQL 은 private personal repo 라 불가 — skip.
4. **tutor chat per-user daily cap** — 새 `user_ai_calls` 테이블 + schema migration 필요. essay 만 50/day 적용된 상태.
5. **§13 부분 도입 발의** — 학습 분석 (Phase 2) 운영 중 → `docs/proposals/v3.7-sidebar-phase2-partial.md` 발의 후 주인님 명시 승인.
6. **`requireUser` helper 32곳 마이그레이션** — 신설했지만 기존 32곳 auth boilerplate 는 점진 migration.
7. **step03 LLM system prompt** — `SEED_TAG_CAP_RULE` 인용 갱신 (현재는 `load-db.mjs` 만 cap 강제).

### 9.6 알려진 함정 (회귀 패턴)

#### 9.6.1 viewport-fit 패턴
- `h-screen + overflow-hidden + flex + flex-1 min-h-0` 패턴은 zoom/F11 변화 시 fragile
- 2026-05-17 dashboard 에서 5번 회귀 → PR #102 에서 완전 제거
- **me/page.tsx, study-plan/page.tsx 잔존** — 동일 패턴 사용 중. 필요 시 PR #102 패턴으로 제거 권장

#### 9.6.2 Recharts ResponsiveContainer
- F11 fullscreen 진입·해제 시 SVG 크기 캐시 회귀 (ResizeObserver 일부 브라우저 미동작)
- LearningTrend article + chart-div 양쪽에 `overflow-hidden` 으로 boundary 방어 (PR #99)

#### 9.6.3 Supabase signUp 자동 세션
- 이메일 인증 OFF 환경에서 `signUp()` 이 자동 세션 발급
- 회원가입 후 `/login` redirect 만으로는 인증 가드가 `/dashboard` 로 튕김
- **`signOut()` 명시 호출 후 redirect** 패턴 사용 (PR #103)

#### 9.6.4 Supabase auth 영문 에러
- `signInWithPassword` 실패 시 "Invalid login credentials" 영문 노출
- `translateAuthError()` 매핑 함수로 한글 변환 (PR #100)
- 정직성 §3의2 정합 — "이메일 또는 비밀번호" 묶어 표기 (계정 enumeration 방어)

#### 9.6.5 localStorage 격리
- localStorage 는 브라우저 단위 저장소 (계정 무관)
- 계정별 격리 필요 시 키에 `user.id` 포함: `fitly:onboarding-dismissed:{userId}` (PR #104)

#### 9.6.6 마이그레이션 적용 방식
- Drizzle 마이그레이션 = Supabase SQL Editor / psql 수동 실행
- `CREATE INDEX CONCURRENTLY` 는 트랜잭션 안에서 실행 불가 (PG 25001)
- Supabase SQL Editor 가 statements 를 단일 트랜잭션으로 wrap → 일반 CREATE INDEX 사용 (PR #94)
- 운영 데이터 10k+ 시 psql 직접 + CONCURRENTLY 변형 (마이그레이션 0002 주석 참고)

#### 9.6.7 빌드 일관성
- 모든 작업 후 **`npx tsc --noEmit` + `npx next lint`** 통과 확인
- 의존성/스키마/config 변경 시 **`npm run build`** 필수

---

## 10. Gemini CLI 운영 가이드

### 10.1 작업 분류별 스킬 매핑 (Claude → Gemini 직접 작업)

> Gemini CLI 는 Claude Code 의 스킬 시스템이 없음 — 본 표의 "Gemini 환경 작업법" 컬럼 적용.

| 작업 분류 | Claude Code 스킬 | Gemini CLI 작업법 |
|---|---|---|
| UI/UX 디자인 결정 | `ui-ux-pro-max` | 본 §6 + 원본 `fitly/DESIGN.md` 우선 참조. WCAG AA 4.5:1, 메모러블 앵커, 액센트 6 사용처 보호 |
| 프론트엔드 컴포넌트 | `senior-frontend`, `react-best-practices` | 본 §3.5 (제17조 스택) + Next.js 15 App Router. `'use client'` 명시. 서버 컴포넌트 우선. |
| 백엔드 / API Routes | `senior-backend`, `senior-fullstack` | Drizzle ORM 직접 사용. `lib/db/queries.ts` 의 `safeRun` 그래스풀 디그레이드 패턴 정합 |
| 데이터베이스 최적화 | `senior-backend` (DB references) | `EXPLAIN ANALYZE` + `pg_stat_statements`. 복합 인덱스 (user_id, timestamp DESC) 패턴 |
| 차트 (Recharts) | `senior-frontend` | `next/dynamic` + `ssr:false` 로 lazy load. ResponsiveContainer overflow-hidden 부모 보호 |
| PDF 파싱 / OCR | `pdf-processing-pro` | `unpdf` (텍스트 PDF) + Gemini Vision (이미지 PDF). 헌법 §13의2 9항 정합 |
| 팟캐스트 (TTS) | `senior-prompt-engineer` | `gemini-2.5-flash-preview-tts` (`src/lib/podcast/tts.ts`). 환경변수 `GEMINI_MODEL_TTS` |
| LLM 프롬프트 설계 | `senior-prompt-engineer` | 본 §7 시드 하네스 4계층 패턴. system instruction 에 헌법 조항 명시 인용 |
| Progress 공식·아키텍처 | `code-reviewer`, `senior-architect` | 본 §3.2 (제9조 Progress 공식 불변). `src/lib/progress/score.ts` 단일 진입점 |
| 일반 코드 리뷰 | `code-reviewer` | `git diff` 수동 점검. 본 §4 (시행령 21·22) + §9.6 함정 패턴 점검 |
| 보안 점검 (Auth·RLS·token) | `senior-security` | Supabase Auth + Drizzle user_id 강제. `.env*` 노출 차단 |
| MCP 서버 작성 | `mcp-builder` | (Gemini CLI 환경 외) — MCP 미적용 |
| 신규 기능 발산 | `brainstorming` | Gemini 직접 대화. 채택 전 헌법 §16 (v3.6.4) 검토 — 주인님 명시 요청 필수 |
| 외부 카피 / SEO | `seo-optimizer` | 본 §6.9 (어조) + 펀치라인 "합격은 시간이 아니라 적합도다" |
| E2E·통합 테스트 | `webapp-testing` (Playwright) | `npx playwright` 직접 (`@playwright/test` 의존성 추가 필요) |
| PWA / 서비스워커 | `progressive-web-app` | `next-pwa` config. SW 가 `/api/*` 캐시 금지 (§3.5 제17조 7항 1호) |
| 발표용 docx | `docx` | `docx` npm 패키지 직접 사용 (`fitly/docs/PPT_제작_계획서.md` 참고) |
| 커밋 메시지 | `git-commit-helper` | 본 §10.3 수동 컨벤션 |

### 10.2 자주 사용 명령

```bash
# 개발 서버
npm run dev

# 타입체크 (5~10초, 빠른 검증)
npx tsc --noEmit

# Lint
npx next lint

# 빌드 (수 분, 의존성·schema·config 변경 시 의무)
npm run build

# Drizzle 마이그레이션 생성 (스키마 변경 후)
npx drizzle-kit generate

# Drizzle 마이그레이션 적용은 Supabase SQL Editor 수동
# (CREATE INDEX CONCURRENTLY 는 psql 직접 적용)

# 데모 시드 (홍길동 180일 사용 이력)
npm run seed:demo

# 테스트
npm test

# 단일 파일 lint
npx next lint --file 'src/path/to/file.tsx'
```

### 10.3 GitHub PR 워크플로우 (Gemini CLI)

```bash
# 1. 브랜치 생성
git checkout -b fix/topic-name

# 2. 작업

# 3. 검증
npx tsc --noEmit
npx next lint --file '<changed files>'

# 4. 스테이징 (구체 파일만)
git add src/path1.tsx src/path2.tsx

# 5. 커밋 (Co-Authored-By 없이, author=Cazeko)
git -c user.name=Cazeko -c user.email=cajeko0913@gmail.com commit -m "$(cat <<'EOF'
fix(scope): 한 줄 요약

상세 설명 — 원인·해결·영향 범위. 헌법 조항 근거 명시.
EOF
)"

# 6. 푸시
git push -u origin fix/topic-name

# 7. PR 생성 — gh CLI 없으면 curl + GitHub API
PAT="<personal access token>"
curl -X POST \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Cazeko/vibe2026-new/pulls \
  -d '{"title":"...","head":"fix/topic-name","base":"main","body":"..."}'

# 8. Vercel 빌드 폴링 — Deployments API (Checks/Statuses 권한 없음)
curl -H "Authorization: Bearer $PAT" \
  "https://api.github.com/repos/Cazeko/vibe2026-new/deployments?sha=<sha>"
# → deployment id 추출 → statuses 조회
curl -H "Authorization: Bearer $PAT" \
  "https://api.github.com/repos/Cazeko/vibe2026-new/deployments/<id>/statuses"
# state: pending → in_progress → success/failure/error

# 9. 머지 (squash) — Vercel success 확인 후
curl -X PUT \
  -H "Authorization: Bearer $PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Cazeko/vibe2026-new/pulls/<num>/merge \
  -d '{"commit_title":"...","commit_message":"...","merge_method":"squash"}'

# 10. 브랜치 정리
git checkout main
git pull --ff-only origin main
git push origin --delete fix/topic-name
git branch -D fix/topic-name
```

### 10.4 헌법 위반 시 절차

1. **결정 전**: 본 §1~§5 의 어떤 조항에 근거하는지 명시 (제24조의2)
2. **충돌 발견**: 위계 우선 (헌법 → 법률 → 시행령 → 시행규칙 → 사용자 발화)
3. **위반 발견**: 즉시 정정 + 사용자 보고 (제37조)
4. **신규 기능 추가**: 사용자 명시 요청 시에만 (§16 v3.6.4). 모호한 요청은 *기존 다듬기*

### 10.5 정직성 체크리스트 (모든 결정·UI·발표 적용)

- [ ] "합격 가능성·확률·점수 예측·지역 핏" 등 금지 표현 사용 X
- [ ] AI 생성물 = `verified: false` 배지 + "AI 생성, 공식 해설 아님" 명시
- [ ] 외부 비공개 데이터 (사설 학원·교사 자료) 의존 약속 X
- [ ] 시드 콘텐츠 = 국가공식 KICE 기출만 (`fitly/kice_pdfs/`)
- [ ] 출처 4계층 모델 (`official/ai_estimate/user_self_corrected/crowd_verified`) 라벨링
- [ ] 진척도 = "본인 누적" 명시, 합격 지표 아님 명시

### 10.6 시급 알림 패턴

다음 시점 = 사용자에게 **즉시 보고** (제37조):

- 빌드·테스트 실패 + 우회 불가
- Vercel 빌드 실패 / 배포 timeout / spend cap 도달
- API 키 누락·revoked
- DB 마이그레이션 적용 실패
- 보안 사고 (RLS 누설·세션 탈취 의심)
- 데이터 결측 (시드 적재 실패·user_card_log 0건)

보고 시 (1) 무엇이 (2) 왜 (3) 영향 (4) 권장 액션 4축 명시.

---

## 부록 A — 빠른 참조 (Cheat Sheet)

### A.1 헌법 8개 절대 원칙 (제0~제4의3·제16·제24의2·제40조)
1. **호칭 "주인님" + 존댓말** — 모든 다른 조항보다 우선
2. **Fitly = 한국 초등임용 1차 학습 플래너 PWA** — 사용자 자료 업로드 X
3. **정직성** — 합격 보장·가능성·컷 추정 일체 금지
4. **펀치라인 — "합격은 시간이 아니라 적합도다"** — 변경 금지
5. **한글 줄바꿈 = 의미 단위·시각적 균형·가독성** + 부호 직후 공백
6. **스코프 — 사용자 명시 요청 시 신규 기능 추가** (모호 요청 = 다듬기 해석)
7. **모든 결정 = 헌법 조항 근거 명시**
8. **개정 = 사용자 명시 승인** (AI 자가 개정 절대 금지)

### A.2 사이드바 7+1+2

대시보드·기출분석·풀이·학습·팟캐스트·학습계획·마이 / + 오답·학습분석 / + 설정·로그아웃

### A.3 카드 3종

QuizCard (서술형 2014~) · KeywordCard (개념 노트, 객관식 흡수) · MistakeCard (again/hard 자동 합류)

### A.4 모델 매트릭스 (학습 본업)

- 채점·첨삭·챗봇·키워드 = **gemini-2.5-flash** (속도 우선, v3.6.3)
- Vision OCR·팟캐스트 스크립트·코칭 = **gemini-3.1-pro-preview**
- 임베딩 = **gemini-embedding-2**

### A.5 디자인 액센트 6 사용처

(a) Progress 게이지 (b) 1차 CTA (c) +N% 델타 (d) 활성 사이드바 (e) AI 추천 카드 (f) 로그인 hero 잉크 trail

### A.6 자주 발생하는 회귀

- viewport-fit fragile → PR #102 패턴 (전면 제거)
- Recharts F11 SVG overflow → overflow-hidden boundary
- Supabase signUp 자동 세션 → signOut 후 redirect
- localStorage 계정 격리 → user.id 포함 키

---

## 부록 B — 파일 위치 인덱스

### B.1 헌법 + 부속
- 헌법 인덱스: `fitly/CLAUDE.md` (Claude Code) / `fitly/GEMINI.md` (본 파일, Gemini CLI)
- 헌법 본체: `fitly/.claude/CONSTITUTION.md`
- 부칙: `fitly/.claude/BYLAWS.md`
- 개정 이력: `fitly/.claude/CHANGELOG.md`
- 법률층: `fitly/.claude/laws/` (10~18)
- 시행령층: `fitly/.claude/decrees/` (21~25)
- 시행규칙층: `fitly/.claude/rules/` (31~35)

### B.2 디자인 + 하네스
- 디자인 시스템: `fitly/DESIGN.md`
- 시드 LLM 하네스: `fitly/docs/harness/seed-llm-prompts.md`

### B.3 기획 + 발의
- 계획서: `fitly/docs/plans/` (2026-05-06 ~ 2026-05-15)
  - v3 임용 디자인: `2026-05-06-fitly-v3-임용-design.md`
  - 시드 파이프라인: `2026-05-06-seed-pipeline-implementation.md`
  - 로그인/랜딩 디자인: `2026-05-06-login-landing-design.md`
  - AI 서술형 워크스페이스: `2026-05-14-essay-workspace-design.md`
  - 비즈니스 모델: `2026-05-15-business-model-design.md`
  - 발표 패키지: `2026-05-15-presentation-package.md`
- 발의서: `fitly/docs/proposals/` (v3.x 헌법 개정 발의 보관소)

### B.4 시드 데이터
- KICE 공식 기출 PDF: `fitly/kice_pdfs/` (2002~2026)
- 백업: `fitly/backups/kice_pdfs.backup-2026-05-06/`

### B.5 발표 + 가이드
- PPT 제작 계획서: `fitly/docs/PPT_제작_계획서.md`
- 시연 영상 가이드: `fitly/docs/시연영상_제작_가이드.md`
- 발표 본문 (PDF): `fitly/assets/references/5 백승환 Fitly 발표 .pdf`
- 발표 파일 (PPTX): `fitly/assets/presentations/발표.pptx`

### B.6 자산 분류 (assets/) — 2026-05-18 정리

> 종전 root 에 흩어져 있던 스크린샷·PDF·예시·연구노트를 카테고리별로 분류.

| 폴더 | 내용 | 비고 |
|---|---|---|
| `fitly/assets/screenshots/` | 모든 PNG·JPEG (디버그·예시·페이지 캡처 등 15장) | `333.png`·`4444.png` 등 디버그 자료 포함 |
| `fitly/assets/references/` | 외부 참고 PDF (백승환 발표·피드백·오답노트 인쇄 등 3건) | |
| `fitly/assets/examples/` | 예시 자료 폴더 (신규 디자인·예시pptx·임용고시 레이아웃) | 디자인 참조용 |
| `fitly/assets/presentations/` | 발표 산출물 (`발표.pptx` 21MB 등) | |
| `fitly/assets/research/` | 연구 노트 (.md — 프롬프트 엔지니어링·하네스) | 메타 연구 자료 |

### B.7 백업 (backups/)
- 사전 cut 보존: `fitly/backups/2026-05-06-pre-drop/`
- ~~env 백업: `fitly/backups/env-backup.zip`~~ → /cso 권고로 `/tmp/fitly-trash-2026-05-18/env-backup.zip` 이동 (2026-05-18)
- 시드 PDF 백업: `fitly/backups/kice_pdfs.backup-2026-05-06/`

### B.9 신규 파일 (2026-05-18 PR #107·#108 머지)

| 경로 | 역할 | 헌법 근거 |
|---|---|---|
| `fitly/src/lib/auth/require-user.ts` | 사용자 인증 헬퍼 (32곳 boilerplate 마이그레이션 기반) | §28 |
| `fitly/scripts/seed/lib/system-prompts.mjs` | 시드 §25의2 태그 cap 5개 강제 + 헌법 근거 명시 인용 (`SEED_TAG_CAP_RULE`) | §24의2 + §25의2 |
| `fitly/.gstack/security-reports/2026-05-18-170100.json` | /cso 보안 감사 보고서 (gitignored) | — |
| `fitly/.gstack/security-reports/2026-05-18-171310-code-review.md` | /review 종합 보고서 (gitignored) | — |
| `/home/jovyan/work/.github/workflows/ci.yml` | CI workflow (lint + tsc + vitest) — **PAT workflow scope 없어 push 보류** | — |
| `/tmp/fitly-trash-2026-05-18/env-backup.zip` | 직전 fitly/backups/env-backup.zip mv 보관 (/cso R2 권고) | — |
| `/home/jovyan/work/fitly-2026-05-18-final*.tar.gz` | fitly 전체 압축본 (.env 포함, 외부 전송 절대 금지) | — |

### B.8 root 유지 파일 (이동 금지)

다음은 자동 도구·표준 컨벤션상 root 에 위치해야 한다:

- **AI 인덱스**: `CLAUDE.md`, `GEMINI.md`, `DESIGN.md`
- **AI 설정**: `.claude/` (Claude Code 위계 본문)
- **빌드 config**: `package.json`, `package-lock.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `postcss.config.mjs`, `drizzle.config.ts`, `vitest.config.ts`, `vercel.json`, `next-env.d.ts`, `tsconfig.tsbuildinfo`
- **env**: `.env`, `.env.local`, `.env.example`
- **lint·git**: `.eslintrc.json`, `.gitignore`, `.npmrc`
- **소스·자산**: `src/`, `public/`, `scripts/`, `node_modules/`, `.next/`, `.vercel/`, `image/`
- **인프라**: `drizzle/`, `supabase/`, **`kice_pdfs/`** (시드 코드가 직접 참조 — 이동 금지), `backups/`
- **문서**: `docs/` (계획·발의·하네스·audit)

---

## 부록 C — 팀 정보

- **팀명**: 편돌이들
- **팀원**: 이정주 · 백승환 · 오세울 · 문규승
- **개발 담당**: Cazeko (cajeko0913@gmail.com)
- **GitHub**: github.com/Cazeko/vibe2026-new
- **개발 기간**: 2026-05-01 ~ (진행 중)
- **출품**: 2026 임용 1차 학습 플래너 부문

---

> **본 문서 유지 보수 정책**:
> - 헌법 v3.x 개정 시 본 §8 (CHANGELOG) + 관련 §1~§5 섹션 즉시 갱신.
> - DESIGN.md 변경 시 본 §6 동기 갱신.
> - 인프라·환경 변경 시 본 §9 갱신.
> - 신규 함정 패턴 발견 시 본 §9.6 추가.
> - 본 파일 자체는 Claude Code 의 `.claude/` 위계 + DESIGN.md 의 인라인 복사이므로,
>   원본 변경 시 본 파일도 동기 갱신해야 한다. 향후 자동 동기 스크립트 검토.
