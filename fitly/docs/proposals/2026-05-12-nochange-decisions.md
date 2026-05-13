# 외부 평가 기반 보수적 NoChange 결정 5건 — 결정 기록 (2026-05-12)

> 발의일: 2026-05-12
> 발의자: Claude
> 승인자: 주관자 (Track 4 위임 발화)
> 헌법 근거: v3.5.4 §3.2 의2 (외부 평가 NoChange 문서화 의무) + 제24조의2 (헌법 근거 의무)

본 문서는 2026-05-12 외부 UI/UX 평가에서 제기된 항목 중, **v3.5.4 PR (`feat/v3.5.4-deferred-tracks`) 에서 적용하지 아니하는** 5 건의 결정 근거와 재평가 조건을 기록한다.

---

## 1. 로그인 페이지 하단 시즌 배너 chevron

### 결정
**NoChange** — 현행 유지.

### 근거
- 외부 평가 의도: chevron 이 있으면 클릭 가능을 시사하므로 동작이 있어야 한다.
- 현황 점검: 로그인 페이지(`src/app/(auth)/login/page.tsx`, `src/components/feature/auth/fitly-sign-in.tsx`) 와 하위 컴포넌트에서 *시즌 배너 + chevron 조합* 이 발견되지 아니함.
- 외부 평가 시점과 코드 베이스 간 drift 추정 — 평가자 시점의 prototype 또는 미들 브랜치에서 본 요소가 있었을 가능성.

### 재평가 조건
배너 + chevron 패턴이 미래 PR 에서 도입되면 본 결정은 자동 무효. 도입 시 chevron 에는 (a) 클릭 핸들러 부착 또는 (b) chevron 제거 중 하나를 시행한다. **clickless chevron 은 §3.2 정직성에 반하므로 절대 금지.**

---

## 2. 시험지 연도 목록 — compact / table toggle

### 결정
**NoChange** — 현행 카드 그리드 유지.

### 근거
- 외부 평가 의도: 연도 목록을 *표 형식*과 *카드 형식*으로 토글 제공.
- 현황 점검: `papers-tab.tsx` 의 `<YearCard>` 그리드 (sm:2col / lg:3col) 이 *밀도 + 시각 구분*을 이미 균형 있게 제공. v3.5.4 에서 학년도 mod 7 좌측 보더 hue (DESIGN §4.4.1) 까지 추가되어 시각 분류 단서가 한 축 더 강화됨.
- 표 형식 토글 도입 시 *두 가지 정보 표현*을 유지·동기화해야 하므로 헌법 §16 (스코프 보호) 부담 증가. 사용자가 직접 표 요청한 적 없음.

### 재평가 조건
사용자(주관자) 또는 baseline 3 명 이상의 베타 학습자가 *"카드로는 한눈에 비교가 어렵다"* 류 피드백을 제출하면, 표 형식 토글 또는 *합본 검색·정렬 페이지* 추가를 §16 단서 안에서 재검토.

---

## 3. MyPage profile / stats 그룹핑

### 결정
**NoChange** — 현행 분리 유지.

### 근거
- 외부 평가 의도: 프로필 카드와 학습 통계 카드를 시각 그룹핑.
- 현황 점검: `me/page.tsx` 가 이미 (a) 프로필 영역, (b) 적합도/스트릭 KPI 영역, (c) 최근 학습 리스트 영역으로 *visual rhythm + 헤더 라벨* 로 분리. 그룹핑 box 추가는 *중복 안내* 가 되어 §4.5 *카드 차분함* 정신과 반대.

### 재평가 조건
프로필 카드와 KPI 카드 사이 *시각 흐름이 끊겨 보인다* 는 사용자 피드백 ≥3 건 누적 시 group section 헤더 (예: `## 내 정보`, `## 적합도 현황`) 추가 검토.

---

## 4. 대시보드 메인 CTA — "오늘 학습 시작 (N장 due)" 라벨

### 결정
**NoChange** — 현행 "오늘 학습 시작" 유지.

### 근거
- 외부 평가 의도: CTA 버튼에 *오늘의 due 카드 수*를 직접 노출하여 시급도 시각화.
- 현황 점검: `DashboardHeader` 는 client component 이며 due count 를 fetch 하지 아니한다. SSR 시점의 dashboard summary (`getDashboardSummary`) 의 plan 배열 안에 due 정보가 들어 있으나, header 컴포넌트는 SSR 결과를 prop 으로 받지 아니하고 `useEffect` 로 user profile 만 client fetch.
- due count 전달을 위해 (a) DashboardHeader 를 server component 로 전환하거나, (b) `/api/dashboard/due-count` 신규 라우트 + client fetch 추가 필요. 둘 다 **신규 데이터 경로 추가** 로 §16 *기존 기능 다듬기* 범위 밖.
- 대시보드 본문 KPI 카드의 "due 합계" 표시로 시급도 정보는 이미 제공됨 — header CTA 라벨은 *행동 유도 (action)* 에 집중.

### 재평가 조건
- 사용자가 명시적으로 due count 를 header CTA 에 *추가 요구* 또는
- `getDashboardSummary` 가 layout 단에서 cached context 로 propagate 되는 인프라가 마련될 때
본 결정은 재검토.

---

## 5. AI 모범답안 키워드 형광펜 효과

### 결정
~~**NoChange** — 형광펜 효과 미적용 (현재 markdown 의 `**bold**` + serif underline 으로 강조).~~

> **2026-05-13 갱신 (v3.6 채택)** — 본 NoChange 결정은 v3.6 발의서 (`2026-05-13-v3.6-comprehensive-amendment.md`) 의 B 조항으로 *대체*. 주관자 명시 위임 발화 정합으로 `<strong>` 요소에 *옅은 gold-soft 형광펜 배경* (≤40%, 다크 ≤30%) 채택. DESIGN §1 만년필 메타포는 기조로 유지하되 학술 노트 형광 강조 보조 도구 허용.

### 근거
- 외부 평가 의도: 모범답안 안의 핵심 키워드에 노란 형광펜(highlighter) 시각 효과.
- 헌법 §0 (호칭과 어투) + DESIGN §1·§4.3 의 *"만년필이 종이 위에 글씨를 쓴다"* 메타포 — 형광펜은 종이 위 *후가공* 시각 단서로, 만년필 메타포와 도구 카테고리가 다르다. 학습용 형광펜은 자칫 학원 prep 도구 코스프레로 흐를 위험 + §4.3 *evergreen 6 사용처 + gold 보호* 와 색 충돌.
- v3.5.3 omnibus 에서 markdown 의 `**bold**` 처리를 *serif underline* 으로 강화 (manuscript 메타포 정합) 하여 핵심 키워드 강조는 이미 시멘틱 안에서 처리됨.

### 재평가 조건
사용자(주관자) 명시 요청 시에만 §4.3·§4.4 단서 또는 DESIGN §1 메타포 개정 절차를 거쳐 검토. 단순 외부 평가만으로는 발동하지 아니한다 (§38 7항 — 사용자 즉시 발화 우선).

---

## 종합 — 적용 여부 표

| 항목 | v3.5.4 적용 | 결정 |
|---|---|---|
| 1. 로그인 chevron | — | NoChange (현재 코드에 없음) |
| 2. 연도 목록 표 토글 | — | NoChange (카드 grid 적정) |
| 3. MyPage 그룹핑 | — | NoChange (이미 분리) |
| 4. 대시보드 CTA "N장" | — | NoChange (인프라 부재) |
| 5. AI 키워드 형광펜 | — | NoChange (메타포 충돌) |

본 5 건은 본 PR 머지와 함께 결정 기록으로 보존된다. 모든 항목은 *재평가 조건* 명시 — 미래 데이터/요청 시 자동 재검토 가능.
