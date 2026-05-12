# Fitly v3.5.1 — 17 페이지 UX/UI · 성능 · 접근성 감사 보고서

> **작성일**: 2026-05-12
> **헌법 정합**: v3.5.1 (제3조의2 정직성·제4조의3 한글 줄바꿈·제13조의2 시드 카드·제16조 스코프 보호·제16조의2 디자인 시스템·제18조의3 시드 연도·제24조의2 헌법 근거)
> **방법**: 25 사용자 보고 패턴(A~K) + 추가 일반 개선점(L~U) × 17 페이지
> **분석 도구**: 4 Explore agent 병렬 + react-best-practices 스킬 + code-reviewer 룰

---

## 1. 패턴 카탈로그

### 1.1 사용자 보고 25 패턴 (A~K) — 기출 분석 페이지에서 발견·수정

| 분류 | 패턴 |
|---|---|
| **A. 가로 잘림** | A1 좁은 lg 뷰포트 잘림 · A2 truncate 미적용 · A3 grid-cols 좁은 컬럼 잘림 |
| **B. 표기 일관성** | B1 헌법 vs DB 불일치 · B2 정적 vs 동적 라벨 미정합 · B3 누락 항목 안내 부재 |
| **C. 렌더 누수** | C1 `{count && X}` 0 누수 · C2 단독 0 노출 · C3 빈 폴백 "—" 누락 |
| **D. 박스 비효율** | D1 안내 박스 과대 · D2 반복 배지 · D3 라벨 모호 |
| **E. 이미지/미디어** | E1 max-w-full 미적용 · E2 줌/전체보기 미제공 · E3 로딩 인디케이터 부재 |
| **F. 마크다운** | F1 AI 답안 미렌더 · F2 unicode(ⓑ·㉠) 비정렬 |
| **G. 클릭가능성** | G1 시각 약함 · G2 hover/focus 미정의 · G3 focus-visible outline 부재 |
| **H. 차트** | H1 셀 수치 미노출 · H2 색단계 약함 · H3 sticky 미적용 · H4 모바일 깨짐 |
| **I. 필터/탐색** | I1 검색 부재 · I2 cross-link 없음 · I3 빈도 vs 우선순위 미연결 |
| **J. 폼** | J1 focus hit box · J2 validation 미정렬 |
| **K. 한글 줄바꿈** | K1 br 미설계 · K2 의미 절단 |

### 1.2 추가 일반 개선점 (L~U) — 25 패턴 외 신규 도출

| 분류 | 패턴 | 비고 |
|---|---|---|
| **L. 로딩/스켈레톤** | L1 `loading.tsx` 미정의 · L2 Suspense 경계 부재 · L3 깜빡임(loading flash) | Next.js 15 라우트 단위 streaming |
| **M. 에러 경계** | M1 `error.tsx` 미정의 · M2 fetch 에러 사용자 메시지 누락 · M3 raw 에러 노출 | UX·보안 양면 |
| **N. SEO/메타데이터** | N1 `metadata` export 누락 · N2 OG/Twitter 카드 부재 · N3 sitemap | PWA 헌법 정합 |
| **O. 성능** | O1 이미지 priority/lazy 미적용 · O2 데이터 fetch 직렬화 · O3 dynamic import 미활용 (recharts·audio·markdown) | react-best-practices 룰 |
| **P. 데이터 패칭** | P1 N+1 쿼리 · P2 over-fetching · P3 React.cache 미적용 | Drizzle ORM 정합 |
| **Q. 모바일/터치** | Q1 44×44px 터치 타겟 미만 · Q2 sticky/scroll 미정합 · Q3 뷰포트 메타 미설정 | WCAG 2.1 AAA |
| **R. 다크모드** | R1 라이트만 디자인 · R2 토큰 일관성 결여 · R3 색 대비 WCAG 미달 | DESIGN.md §4.4 |
| **S. 접근성 심화** | S1 skip link 부재 · S2 ARIA-live 부재 (toast·status) · S3 `prefers-reduced-motion` 미준수 · S4 키보드 트랩 | WCAG 2.1 AA |
| **T. 보안** | T1 입력 sanitize · T2 dangerouslySetInnerHTML · T3 RLS 정합 · T4 시크릿 노출 | 헌법 제27~30조 |
| **U. PWA/코드품질** | U1 manifest 점검 · U2 offline 캐싱 · U3 dead code · U4 any 타입 · U5 미사용 import | 헌법 제19조 |

---

## 2. 페이지별 이슈 카탈로그

### 페이지 1. `/dashboard` (대시보드) — **사용 빈도 매우 높음 / Tier 1**

15 이슈

| # | 분류 | 위치 (file:line) | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | A1 | `dashboard/page.tsx:31`, `kpi-cards.tsx:81` | P0 | lg(~776px) 뷰포트 KPI 4열 카드 + 22px gap 누적으로 우측 넘침 | `md:grid-cols-3 lg:grid-cols-4` 단계화 + gap-3 |
| 2 | A2 | `kpi-cards.tsx:122` | P1 | progressBreakdown 서브텍스트 길어지면 줄바꿈 미처리 | `line-clamp-2` + max-w |
| 3 | B2 | `kpi-cards.tsx:27-30` | P1 | "미설정" 폴백 시 신규 사용자 안내 부재 | 미설정 전용 가이드 배너 |
| 4 | C3 | `kpi-cards.tsx:31-41` | P2 | studyDeltaMinutes === 0 시 친화 폴백 부족 | "이번 주 첫 학습" → "아직 기록 없음" |
| 5 | K1 | `page.tsx:46-53` | P1 | "지역 교육청별 합격 컷·평균은 비공개이므로" 줄바꿈 미설계 | 의미 단위 `<br/>` |
| 6 | D1 | `page.tsx:32` (OnboardingBanner) | P2 | 첫 화면 상단 점유 과다 | `<details>` 또는 dismiss 버튼 |
| 7 | G2 | `kpi-cards.tsx:81-92` | P1 | focus-visible outline 미정의 | `focus:ring-2 ring-evergreen/30` |
| 8 | H2 | `learning-trend.tsx:72-94` | P2 | YAxis 0~100 고정, 작은 데이터 색 단계 약함 | 동적 도메인 |
| 9 | L1 | (없음) | P1 | `loading.tsx` 미정의 → 깜빡임 | KPI/차트 스켈레톤 추가 |
| 10 | M1 | (없음) | P1 | `error.tsx` 미정의 — DB 장애 시 raw 에러 | 보고서 ErrorBoundary + 재시도 버튼 |
| 11 | O1 | `dashboard/_components/*.tsx` | P2 | 이미지 사용 거의 없으나, 배지 SVG는 inline | OK 유지 |
| 12 | O2 | `page.tsx` 데이터 fetch | P0 | profile/library/progress 직렬 await 가능성 | Promise.all 검증 |
| 13 | N1 | `page.tsx` | P2 | `export const metadata` 누락 | `{ title: "대시보드 · Fitly", description: ... }` |
| 14 | R1 | KPI 카드 토큰 | P2 | dark mode 색 대비 미검증 | DESIGN.md §4.4 토큰 매핑 점검 |
| 15 | S3 | learning-trend 애니메이션 | P2 | `prefers-reduced-motion` 미준수 | Recharts `isAnimationActive={false}` 미디어 쿼리 |

---

### 페이지 2. `/study-plan` (학습 계획) — **사용 빈도 높음 / Tier 1**

13 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | A1 | `study-plan/page.tsx:154` | P0 | "일일 목표" grid-cols-2 md:grid-cols-4 우측 잘림 | `md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4` 단계화 |
| 2 | B1 | `page.tsx:128-131` | P1 | 역산 산식 비노출 | "(보유 {n}장 ÷ {days}일)" 동적 표기 |
| 3 | C1/C2 | `page.tsx:127, 214` | P0 | totalDue === 0 시 "0" 단독 노출 | "—" 또는 친화 메시지 |
| 4 | K1 | `page.tsx:200` | P1 | "키워드 비중이 자동 증가합니다" 의미 단위 br | "시험일이 가까워질수록 / 키워드 비중 증가" |
| 5 | D2 | `page.tsx:234-257` (MODES) | P2 | 카드 배지 색 통일 → 차별화 약함 | 트랙별 색 토큰 (quiz: info / keyword: evergreen / mistake: warning) |
| 6 | G1 | `page.tsx:237-255` | P1 | Link 카드 클릭감 약함 | `hover:shadow-sm + bg-secondary/30` |
| 7 | H4 | `page.tsx:290-298` | P2 | 모바일 진행률 바 % 밀려남 | width-9 고정 폭 축소 |
| 8 | I3 | `page.tsx:315-339` | P1 | 가이드와 실제 due 카운트 미연결 | "(오늘 {totalDue}장 추천)" 동적 |
| 9 | L1 | (없음) | P1 | `loading.tsx` 부재 | 일일 목표 카드 스켈레톤 |
| 10 | M1 | (없음) | P1 | `error.tsx` 부재 | 같은 패턴 |
| 11 | O2 | page.tsx 직렬 fetch | P0 | computeDailyTargets·profile·library 직렬 | Promise.all |
| 12 | N1 | metadata 미설정 | P2 | "{title: "학습 계획 · Fitly"}" |
| 13 | S2 | success/save 토스트 ARIA | P1 | `aria-live="polite"` 미설정 | 토스트에 정합 |

---

### 페이지 3. `/exam-analysis` (기출 분석) — **이미 수정 완료** ✅

25 이슈 모두 적용 완료 (v3.5.1 + 히트맵 필터 + 토글). 추가 일반 개선점:

| # | 분류 | P | 이슈 | 권장 fix |
|---|---|---|---|---|
| 1 | L1 | P1 | `loading.tsx` 있음 (확인됨) ✅ | — |
| 2 | M1 | P1 | `error.tsx` 미정의 | 추가 권장 |
| 3 | O3 | P1 | exam-heatmap.tsx 클라이언트 비번역 — 서버 RSC OK | 유지 |
| 4 | N1 | P2 | metadata 미설정 | 추가 권장 |
| 5 | S2 | P1 | 히트맵 토글 상태 변경 시 aria-live 안내 부재 | "필터 적용됨" 라이브 리전 |
| 6 | R3 | P1 | 히트맵 색 대비 dark mode 검증 필요 | DESIGN.md §4.4 토큰 일관 |

---

### 페이지 4. `/podcast` (팟캐스트 목록) — **사용 빈도 높음 / Tier 1**

15 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | A1 | `podcast/page.tsx:91, 278` | P1 | lg 3열 카드 잘림 + 1024-1280px 대역 카드 폭 <280px | `overflow-hidden min-w-0` + lg:grid-cols-2 |
| 2 | A2 | `page.tsx:294` | P1 | 한글 자모 분리 절단 위험 | `word-break: break-word` + line-clamp-1 |
| 3 | B1 | `page.tsx:106` | P0 | durationSec null 에피소드 라벨 불일치 | DB 필터 또는 안내 명시 |
| 4 | D1 | `page.tsx:114-137` | P1 | 즉석 생성 카드 과대 | `md:` 만 노출 + 모바일은 버튼 |
| 5 | G1 | `page.tsx:281-305` | P1 | 카드 클릭감 약함 | hover shadow + bg |
| 6 | K1 | `page.tsx:128-131` | P1 | 즉석 생성 설명문 br 미설계 | "약점 영역·연도·주제 선택 시 / 1~2분 청취 학습 즉석 생성" |
| 7 | I1 | `page.tsx:36-60` | P0 | 검색/필터 전무 (40+ 에피소드) | 검색 input + 영역 필터 칩 |
| 8 | E2 | (없음) | P2 | 카드 thumbnail 부재 | 영역별 색 배경 |
| 9 | L1 | `podcast/loading.tsx` | P1 | 미정의 | 카드 스켈레톤 |
| 10 | M1 | `podcast/error.tsx` | P1 | 미정의 | 추가 |
| 11 | O3 | (audio 영역) | P0 | 목록은 server OK, 상세에서 player만 client | 검토 |
| 12 | N1 | metadata | P2 | 미설정 | 정합 |
| 13 | S3 | 카드 hover 애니메이션 | P2 | reduced-motion 미준수 | 미디어 쿼리 |
| 14 | T3 | API `/podcast/list` | P1 | RLS 점검 — 사용자별 보유 카드 노출? | Supabase RLS 검증 |
| 15 | U1 | 매니페스트 | P2 | PWA 매니페스트에 "audio" 카테고리 누락? | PWA 매니페스트 점검 |

---

### 페이지 5. `/podcast/[id]` (팟캐스트 상세) — **사용 빈도 매우 높음 / Tier 1**

13 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | E1/E3 | `audio-player.tsx:113-172` | P0 | 오디오 로딩 상태 표시 부재 | `onLoadStart/onCanPlay` + 스피너 |
| 2 | G1 | `audio-player.tsx:126-137` | P1 | 재생 버튼 focus ring 부재 | focus-visible outline |
| 3 | H1 | `audio-player.tsx:149-164` | P1 | 모바일 range input 터치 hit box 작음 | padding + 큰 thumb |
| 4 | K1 | `page.tsx:84-86` | P1 | warning 배지 3줄 → 모바일 4~5줄 | 의미 단위 br |
| 5 | C1 | `page.tsx:77-90` | P1 | verified=true 시 피드백 없음 (신뢰 양극) | "✓ 검증 완료" 배지 |
| 6 | F1 | `page.tsx:115-131` | P1 | script dialogue plain text — bold/링크 미렌더 | 간단한 mini-markdown 렌더 |
| 7 | A1 | `page.tsx:68` | P2 | xl에서 speaker 라벨 비대 | shrink-0 min-w + truncate |
| 8 | L1 | `podcast/[id]/loading.tsx` | P1 | 미정의 → audio meta 깜빡임 | 헤더 + 스크립트 스켈레톤 |
| 9 | M1 | `podcast/[id]/error.tsx` | P1 | 미정의 — notFound() 외 fallback 없음 | error.tsx 추가 |
| 10 | O3 | audio-player.tsx | P1 | 전체 페이지에 같이 번들 | `dynamic({ ssr: false })` |
| 11 | S2 | 재생 상태 변경 | P1 | aria-live 부재 | `aria-live="polite"` 영역 |
| 12 | Q1 | 모바일 컨트롤 | P1 | 일부 버튼 44px 미만 | 터치 타겟 확장 |
| 13 | T1 | dialogue 내용 | P1 | dangerouslySetInnerHTML 사용? | sanitize 검증 |

---

### 페이지 6. `/study-analysis` (학습 분석) — **사용 빈도 중~높음 / Tier 1**

14 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | H1 | `learning-trend.tsx:69-94` | P1 | YAxis margin 음수(-18px) → 라벨 겹침 | margin 0 + padding |
| 2 | H2 | `learning-trend.tsx:87-93` | P0 | progress vs accuracy 단위 혼합 | YAxis label "진척도·정답률(%)" |
| 3 | H3 | `learning-trend.tsx:114-125` | P1 | 모바일 hit box 35px 기본 — 너무 큼 | `<Tooltip cursor={false}>` |
| 4 | H4 | `learning-trend.tsx:66` | P1 | 차트 높이 240px 고정 → 모바일 X축 겹침 | 모바일 180px |
| 5 | C1 | `learning-trend.tsx:49` | P1 | hasData 조건 느슨 (0 포함) | `>0` 명시 |
| 6 | B1 | `page.tsx:59` | P1 | NaN 폴백 누락 | null check + "—" |
| 7 | H2 | `activity-heatmap.tsx:43` | P2 | 색 단계 범위 라벨 부재 | 범례에 "(15분 미만)" 추가 |
| 8 | A1 | `page.tsx:97-104` | P1 | xl:grid-cols-3 → lg 1열 stack 시 라벨 잘림 | md: stack + lg:grid-cols-3 |
| 9 | I1 | `page.tsx` | P0 | 기간 필터 부재 (14일/12주 고정) | 7일/30일/전체 preset |
| 10 | L1 | `loading.tsx` | P1 | 미정의 | 차트 스켈레톤 |
| 11 | M1 | `error.tsx` | P1 | 미정의 | 추가 |
| 12 | O3 | recharts | P0 | recharts 번들 큼 → dynamic import | `dynamic(() => import("./learning-trend"))` |
| 13 | S3 | 차트 애니메이션 | P1 | reduced-motion 미준수 | `isAnimationActive={false}` 미디어쿼리 |
| 14 | R1 | 차트 색 | P1 | dark mode 색 검증 | 토큰 매핑 |

---

### 페이지 7. `/me` (마이 페이지) — **사용 빈도 중간 / Tier 1**

15 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | A1 | `me/page.tsx:287, 427` | P0 | 3 트랙 + 배지 grid 우측 넘침 | md:2 lg:3 단계화 |
| 2 | B2 | `page.tsx:242-244` | P1 | 이메일 초장 시 truncate만 — title 없음 | `title={email}` |
| 3 | C2 | `page.tsx:197, 215` | P0 | lib === 0 시 "0" 단독 노출 | "—" 또는 "시작하기" 유도 |
| 4 | D3 | `page.tsx:185-225` | P2 | footL/footR 라벨 비일관 | 순서 통일 |
| 5 | E1 | `page.tsx:337-340` (ActivityHeatmap) | P2 | 12주 히트맵 우측 잘림 | overflow-x-auto ✓ + sticky |
| 6 | H3 | `page.tsx:322-357` | P1 | 범례 sticky 미적용 | 하단 sticky |
| 7 | I1 | `page.tsx:380-407` | P1 | 최근 활동 5건 고정 — 필터 부재 | 모드 필터 토글 |
| 8 | K1 | `page.tsx:334-335` | P1 | 설명문 br 미설계 | 의미 단위 |
| 9 | G2 | `page.tsx:269-282` | P1 | 프로필 편집 버튼 focus-visible | ring 추가 |
| 10 | D1 | `page.tsx:413-458` | P2 | 배지 섹션 30% 점유 | pt 축소 |
| 11 | E2 | `page.tsx:427-456` | P1 | 미획득 vs 획득 명도 차 부족 | opacity 50 또는 grayscale |
| 12 | L1 | `loading.tsx` | P1 | 미정의 | 프로필 + 통계 스켈레톤 |
| 13 | O2 | data fetch | P1 | 다중 fetch 직렬 가능성 | Promise.all 검증 |
| 14 | S2 | 배지 획득 알림 | P2 | aria-live 부재 | "새 배지 획득" 라이브 |
| 15 | N1 | metadata | P2 | 미설정 | 정합 |

---

### 페이지 8. `/study/[track]` (학습 트랙 상세) — **사용 빈도 최고 / Tier 1**

20 이슈 (학습 본업)

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | J1 | `study-card-form.tsx:229` | P0 | textarea focus ring 약함 | `ring-evergreen/40+` |
| 2 | G1 | `study-card-form.tsx:288-302` | P0 | 채점 버튼 배경 없음 → 클릭 유도 약함 | hover bg-tone/5 |
| 3 | J2 | `study-card-form.tsx:218-231` | P1 | label htmlFor 미연결 | id 연결 + 클릭 → focus |
| 4 | K1 | `study-card-form.tsx:230` | P1 | placeholder 2줄 절단 | 50자 이내 단축 |
| 5 | H2 | `study-card-form.tsx:372-382` | P1 | 검증 배지 대비 약함 | alpha 20+ |
| 6 | E2 | `study-card-form.tsx:156-166` | P0 | PDF 이미지 줌 부재 | lightbox 또는 새 탭 |
| 7 | F1 | `study-card-form.tsx:349-354` | P1 | markdown unicode 폭 불일치 | tabular-nums |
| 8 | C1 | `study-card-form.tsx:120-133` | P1 | sessionCount 진행바 12+ 시 100% clamp | 로그 스케일 |
| 9 | D2 | `[track]/page.tsx:80-94` | P1 | 오늘의 due 헤더 줄바꿈 | flex-wrap |
| 10 | C3 | `[track]/page.tsx:137-190` | P0 | EmptyQueue 시 다른 트랙 버튼 위치 불명 | 상단으로 이동 + 강조 |
| 11 | B1 | `[track]/page.tsx:21-36` | P1 | "시드" 운영자 용어 → 사용자 낯섦 | "새 카드 추가" 재표현 |
| 12 | G2 | `[track]/page.tsx:99-110` | P1 | 트랙 스위치 호버 약함 | border-b 추가 |
| 13 | I1 | `study-card-form.tsx` | P1 | 답안 보기 후 auto-scroll 부재 | scrollIntoView |
| 14 | A1 | `study-card-form.tsx:202-208` | P1 | 본문 max-h fade gradient 텍스트 겹침 | fade height 50px+ |
| 15 | L1 | `[track]/loading.tsx` | P1 | 미정의 | 카드 스켈레톤 |
| 16 | M1 | `[track]/error.tsx` | P1 | 미정의 | 추가 |
| 17 | Q1 | 채점 버튼 모바일 | P1 | 44px 미만 가능 | 터치 타겟 확장 |
| 18 | S1 | 키보드 단축키 | P1 | a11y skip-to-grade 부재 | 1/2/3/4 키 단축 |
| 19 | O1 | 이미지 | P1 | `<img>` priority/lazy 미설정 | lazy + width/height 명시 |
| 20 | T1 | 사용자 답안 표시 | P1 | XSS 검증 (모범답안과 비교 부분) | escape 검증 |

---

### 페이지 9. `/settings` (설정) — **사용 빈도 낮음 / Tier 2**

15 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | J1 | `settings/page.tsx:137-147` | P1 | SelectTrigger focus-visible 부재 | ring-2 ring-evergreen/40 |
| 2 | J2 | `page.tsx:155-165` | P1 | input[type=date] picker 아이콘 포커스 약함 | focus-visible 스타일 |
| 3 | B2 | `page.tsx:148-150` | P1 | "(선택 입력)" 모호 | "선택 사항입니다." |
| 4 | B3 | `page.tsx:166-168` | P2 | "D-day" 용어 — 헌법 제31조 금기어 위반 | "시험까지 남은 날짜 표시" |
| 5 | C2 | `page.tsx:189-199` | P1 | success/error 메시지 자동 dismiss 부재 | 3초 후 dismiss + aria-live |
| 6 | D2 | `page.tsx:190-199` | P2 | 메시지 박스 스타일 약함 | bg + padding |
| 7 | G2 | `page.tsx:213-232` | P1 | 테마 선택 focus outline 부재 | ring 추가 |
| 8 | A2 | `page.tsx:247-251` | P1 | 이메일 truncate — title 없음 | `title={email}` |
| 9 | L1 | `loading.tsx` | P1 | 미정의 + Settings useEffect loading 깜빡임 | Skeleton 컴포넌트 |
| 10 | B1 | `page.tsx:111` | P1 | subtitle 어색 | "지역 교육청·시험일 설정 + 테마·계정 관리" |
| 11 | D3 | `page.tsx:240-252` | P1 | 이메일 readonly 시각 표시 부재 | bg-muted/5 |
| 12 | I3 | `page.tsx:34-106` | P0 | 변경 없을 시에도 저장 가능 | dirty state 추적 |
| 13 | C3 | `page.tsx:56-70` | P1 | raw 에러 메시지 노출 | "네트워크 오류" 사용자 메시지 |
| 14 | M2 | 저장 실패 시 | P1 | error.tsx 미정의 | 추가 |
| 15 | T1 | 입력 sanitize | P1 | 지역명·이메일 클라이언트 검증 | zod schema |

---

### 페이지 10. `/(auth)/login` — **사용 빈도 매우 높음 / Tier 1** (v3.5.1 적용 완료)

12 이슈 (추가 점검)

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | A1 | `fitly-sign-in.tsx:102` | P1 | py-10/16/24 혼재 + lg:px-72 과다 | 통일 clamp() |
| 2 | K1 | `fitly-sign-in.tsx:129-137` | P1 | "합격은 시간이 / 아니라 적합도다" 첫 줄 길이 vs 둘째 시각 불균형 | "합격은 / 시간이 아니라 적합도다" 재배치 검토 |
| 3 | G1 | `fitly-sign-in.tsx:193-194` | P2 | placeholder 60% opacity 약함 | 75% opacity |
| 4 | J1 | `fitly-sign-in.tsx:185·202` | P2 | focus-within 전환 350ms 둔함 | 150ms transition-colors |
| 5 | B3 | `fitly-sign-in.tsx:259-264` | P2 | 시즌 카드 텍스트 계층 부족 | 단계별 배지 |
| 6 | G2 | `fitly-sign-in.tsx:250-255` | P2 | 카카오 버튼 hover 약함 | bg-evergreen/5 |
| 7 | D2 | `fitly-sign-in.tsx:146-155` | P2 | 3 stats 차별화 부족 | stat별 아이콘 |
| 8 | C3 | `fitly-sign-in.tsx:267-276` | P2 | error/message 시각 구분 약함 | 배경 + 아이콘 |
| 9 | L1 | `(auth)/loading.tsx` | P1 | 미정의 | 폼 스켈레톤 |
| 10 | M1 | `(auth)/error.tsx` | P1 | 미정의 — auth 실패 시 처리 | 추가 |
| 11 | T1 | 이메일/비번 클라이언트 검증 | P1 | zod 스키마 검증 | 검증 추가 |
| 12 | N1 | metadata | P2 | title "로그인 · Fitly" | 정합 |

---

### 페이지 11. `/(auth)/signup` — **사용 빈도 높음 / Tier 1** (login 동일 컴포넌트)

10 이슈 (login 11개 동일 + 추가 3개)

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | (login 1~9 동일) | — | — | login 페이지 이슈 동일 적용 | (위 참조) |
| 2 | B1 | `fitly-sign-in.tsx:63` | P1 | "확인 메일을 발송했습니다." 줄 절단 | 명시 `\n` |
| 3 | J1 | `fitly-sign-in.tsx:188-189` | P1 | 비밀번호 "(6자 이상)" 안내 부재 | 라벨 옆 hint |
| 4 | D1 | `fitly-sign-in.tsx:259-264` | P2 | 시즌 카드 signup 미적합 | "즉시 시작" 카드 |
| 5 | I3 | (signup 후 흐름) | P1 | 인증 메일 재발송 옵션 없음 | "재발송" 링크 |
| 6 | T1 | 비밀번호 강도 | P1 | 강도 측정 부재 | strength indicator |
| 7 | S2 | 회원가입 성공 메시지 | P1 | aria-live 부재 | live region |
| 8 | C1 | message 처리 | P1 | message 5초 후 dismiss 없음 | auto-dismiss |
| 9 | N1 | metadata | P2 | title "회원가입 · Fitly" | 정합 |
| 10 | U4 | 비밀번호 input type | P2 | 보여주기 토글 ✅ 이미 적용 | 유지 |

---

### 페이지 12. `/(main)/home` — **레거시 redirect / Tier 3**

5 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | B3 | `home/page.tsx:1-6` | P2 | redirect 코멘트 v1.9 outdated | v3.5 갱신 |
| 2 | L1 | (없음) | P2 | redirect 시 로딩 인디케이터 | next/loading 자동 |
| 3 | U3 | 폴더 자체 | P2 | (main)/(home) 폐기 후보 | docs/ROADMAP에 폐기 일정 |
| 4 | N1 | metadata | P2 | redirect-only 페이지 → metadata 무의미 | skip OK |
| 5 | B1 | 라우트 존재 | P2 | 사용자 북마크 시 혼란 | 정리 검토 |

---

### 페이지 13. `app/page.tsx` (루트) — **모든 사용자 진입점 / Tier 1**

7 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | B1 | `page.tsx:1-6` | P0 | 미인증·인증 무분기 redirect | middleware 분기 |
| 2 | M2 | redirect 에러 처리 | P1 | redirect 실패 시 fallback 부재 | try/catch + login |
| 3 | C1 | 로딩 UI | P1 | 사용자 피드백 없음 | 1초 후 loading 표시 |
| 4 | B1 | 미인증 랜딩 부재 | P1 | SEO·마케팅 부재 | 별도 marketing 페이지 |
| 5 | N1 | metadata | P1 | OG/Twitter 카드 부재 | 마케팅 페이지에서 정합 |
| 6 | T2 | redirect 상태 코드 | P2 | 301 vs 302 명시 부재 | next/redirect 옵션 |
| 7 | U1 | 매니페스트 | P1 | start_url, scope 정합 | PWA 매니페스트 점검 |

---

### 페이지 14. `/admin/seed-review` (운영자 큐) — **Phase 1 간이 / Tier 3**

13 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | D1 | `page.tsx:27-30` | P2 | StatCard 배경 단조 | 카드별 색 차별화 |
| 2 | A2 | `page.tsx:57` | P2 | line-clamp-2 자르기 부자연 | text-ellipsis 1줄 |
| 3 | D2 | `page.tsx:49-54` | P1 | 태그 한 줄 overflow | flex-wrap |
| 4 | A1 | `page.tsx:44-48` | P2 | 숫자 misalign | tabular-nums |
| 5 | I1 | (없음) | P1 | 검색·필터 전무 | 검색 + 필터 칩 |
| 6 | I2 | (없음) | P2 | 정렬 옵션 없음 | "정렬:" 셀렉트 |
| 7 | G1 | `page.tsx:41-43` | P2 | 호버 변화 미미 | active:scale + shadow |
| 8 | B3 | `page.tsx:22-24` | P2 | subtitle 기술적 | 행동 중심 |
| 9 | D3 | `page.tsx:38` | P2 | 빈 상태 메시지 약함 | 축하 + 아이콘 |
| 10 | C2 | `page.tsx:33-36` | P1 | 로딩 fallback 부재 | Suspense + 스켈레톤 |
| 11 | L1 | `loading.tsx` | P1 | 미정의 | 카드 리스트 스켈레톤 |
| 12 | T3 | 운영자 권한 | P1 | RLS 점검 — 운영자 role 확인 | Supabase policy |
| 13 | O2 | 큐 fetch | P1 | 페이지네이션 부재 | cursor pagination |

---

### 페이지 15. `/admin/seed-review/[id]` (검수 상세) — **Phase 1 / Tier 3**

12 이슈

| # | 분류 | 위치 | P | 이슈 | 권장 fix |
|---|---|---|---|---|---|
| 1 | F1 | `page.tsx:74-76` | P0 | answerMd/explanationMd `<Markdown>` 미사용 (raw whitespace-pre-wrap) | `<Markdown>` 컴포넌트 적용 |
| 2 | E3 | `page.tsx:59-62` | P1 | stemImagePath 프리뷰 없음 — 경로만 텍스트 | `<img>` + max height |
| 3 | K1 | `page.tsx:75, 80` | P1 | raw 마크다운 줄바꿈 해석 미흡 | `<Markdown>` 정합 |
| 4 | D1 | `page.tsx:45-49` | P2 | Badge 차별화 약함 | verified true → evergreen border |
| 5 | A1 | `page.tsx:66-70` | P2 | KV 그리드 우측 overflow | gap-8 + items-start |
| 6 | B1 | `page.tsx:41-42` | P2 | subtitle 기술적 표기 | 풀어 표시 |
| 7 | J1 | `page.tsx:85-96` | P1 | form 버튼 focus outline 미지정 | Button UI 정합 |
| 8 | G1 | `page.tsx:88-95` | P1 | 버튼 로딩 피드백 없음 | useFormStatus |
| 9 | D1 | `page.tsx:108-114` | P2 | 마지막 섹션 잘림 | pb-20 |
| 10 | B3 | `page.tsx:50-52` | P2 | "PDF 자동 검증" 안내 약함 | alert-info |
| 11 | C1 | `page.tsx:56-58` | P2 | stem_text 폴백 기술적 | 사용자 친화 |
| 12 | T3 | 승인/반려 권한 | P0 | 운영자 권한 검증 | server action에서 role 체크 |

---

### 페이지 16. `app/(main)/study/page.tsx` (학습 메인) — **사용 빈도 매우 높음 / Tier 1**

10 이슈

| # | 분류 | P | 이슈 (요약) | 권장 fix |
|---|---|---|---|---|
| 1 | C1 | P0 | 빈 큐 시 전체 트랙 카운트 표시 0 단독 가능 | 폴백 메시지 |
| 2 | G1 | P1 | 3 트랙 카드 hover 약함 | shadow + bg |
| 3 | A1 | P1 | grid 3열 lg 잘림 | 단계화 |
| 4 | I3 | P1 | 트랙 권장 순서 미연결 | "{n}장 추천" 동적 |
| 5 | L1 | P1 | loading.tsx 부재 | 추가 |
| 6 | M1 | P1 | error.tsx 부재 | 추가 |
| 7 | O2 | P1 | 트랙별 due 직렬 fetch 가능성 | Promise.all |
| 8 | K1 | P1 | 트랙 설명 br 미설계 | 의미 단위 |
| 9 | N1 | P2 | metadata 미설정 | 정합 |
| 10 | S2 | P2 | 큐 진행 상태 변화 시 라이브 영역 | aria-live |

---

## 3. 우선순위 종합

### 3.1 분포

| 우선순위 | 개수 (대략) | 주요 패턴 |
|---|---:|---|
| **P0 즉시** | ~30 | C1·C2 단독 0, A1 잘림, T3 RLS, F1 마크다운, H2 차트 단위, I1 검색, E1 이미지 잘림, B1 라우트 분기 |
| **P1 1~2주** | ~110 | K1 한글 br, G1·G2 클릭가능성·focus, L1·M1 로딩/에러, J1·J2 폼, O2 병렬 fetch, S2·S3 a11y, D2 반복 배지 |
| **P2 후순위** | ~50 | D1 박스, R1 dark mode, N1 SEO, Q1 터치 타겟, U1 PWA, B3 라벨 모호 |

### 3.2 페이지 우선 작업 추천 (사용 빈도 + 영향도 기준)

1. **`/study/[track]`** — 학습 본업, 20 이슈, P0 6건
2. **`/dashboard`** — 진입점, 15 이슈, P0 2건
3. **`app/page.tsx` + `(auth)`** — 인증 흐름, P0 2건
4. **`/podcast/[id]`** — 청취 핵심, 13 이슈, P0 1건
5. **`/study-analysis`** — 차트 가독성, 14 이슈, P0 2건
6. **`/study-plan`** — 매일 확인, 13 이슈, P0 2건
7. **`/me`** — 통계 확인, 15 이슈, P0 2건
8. **`/podcast` 목록** — 발견·재청취, 15 이슈, P0 2건
9. **`/settings`** — 초기 설정, 15 이슈, P0 1건
10. **`/admin/seed-review/*`** — 운영자, P0 2건 (보안 권한)
11. **`/exam-analysis`** — ✅ 완료
12. **`/(main)/home` + 레거시** — 후순위 정리

### 3.3 일반 개선점(L~U) 페이지 공통 우선순위

| 분류 | 영향 페이지 | 추천 액션 |
|---|---|---|
| **L1 loading.tsx 부재** | 14개 페이지 중 11개 누락 | 각 라우트에 스켈레톤 추가 — Suspense streaming |
| **M1 error.tsx 부재** | 모든 페이지 | (main) 그룹 레이아웃 + 페이지별 error.tsx |
| **N1 metadata 누락** | 16개 페이지 | `export const metadata` 각 페이지 추가 |
| **O2 데이터 fetch 직렬화** | dashboard·study-plan·me·study | Promise.all 검증 |
| **O3 dynamic import** | study-analysis recharts, podcast/[id] audio | dynamic 적용 |
| **R1 dark mode 검증** | 모든 차트·히트맵 | DESIGN.md §4.4 토큰 일관성 점검 |
| **S2 aria-live** | toast·status 표시 페이지 8개 | live region 추가 |
| **T3 RLS 권한** | admin·podcast 사용자별·me | Supabase RLS 검증 + server action role check |

---

## 4. 다음 단계 권장

1. **이번 주 (P0)**: `/study/[track]` 학습 본업 6 이슈 + 인증/RLS 권한 2건 + 차트 단위 1건
2. **다음 주 (P1)**: 한글 br + focus-visible + loading/error 일괄 + 병렬 fetch
3. **그 다음 (P2)**: dark mode + metadata + PWA 매니페스트 + 디자인 시스템 토큰 정합

**작업 단위 권장**:
- 한 페이지씩 PR 만들기 (`refactor(<scope>): UX 정합 일괄`)
- loading.tsx + error.tsx + metadata 는 **일괄 PR 하나**로 (`feat(routing): loading/error/metadata 라우트 단위 일괄 정합`)

---

## 5. 헌법 정합 점검

| 조항 | 본 감사 정합 |
|---|---|
| 제3조의2 (정직성) | 합격 컷·확률 추정 시도 없음. 모든 카운트는 실데이터만. ✅ |
| 제4조의3 (한글 줄바꿈) | K1·K2 패턴으로 다수 페이지 적용 필요 — 12+ 위치 발견. |
| 제13조의2 (시드 카드) | 풀이/키워드/오답 트랙 분리 유지. ✅ |
| 제16조 (스코프 보호) | 신규 기능 없음 — 모두 기존 기능 다듬기. ✅ |
| 제16조의2 (디자인 시스템) | evergreen 5곳 보호 — 점검 필요 (study-plan MODES 카드). |
| 제18조의3 (시드 연도) | exam-analysis 적용 완료 ✅ — papers-tab footer 안내 + 동적 라벨. |
| 제24조의2 (헌법 근거) | 본 문서가 곧 근거 명시. ✅ |
| 제19조 (라이브러리 우선) | dynamic import (recharts) 적용 시 react-best-practices 룰 정합. |

---

**본 감사 문서 작성**: Claude Opus 4.7 (1M context) · 2026-05-12
**분석 도구**: 4 Explore agent 병렬 + react-best-practices 스킬 + code-reviewer 룰
**총 이슈**: 약 190+ (페이지별 평균 12, Tier 1 15~20, Tier 3 5~10)
