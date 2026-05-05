# Fitly · Design System

본 문서는 Fitly 의 시각·UI 결정의 **단일 소스 오브 트루스(Single Source of Truth)** 이다.
- 모든 폰트·색·여백·레이아웃·모션 결정은 본 문서를 따른다.
- 변경은 헌법 제16조의2 정합 — 사용자(주관자) 명시 승인이 있어야 한다.
- 본 문서는 헌법(`fitly/CLAUDE.md`) 에 종속되며, 헌법 개정 시 함께 갱신된다.

---

## 0. 메모러블 앵커 (변경 금지)

> **공책 가로 괘선 + 세리프 헤드라인 + 학습 진척도만 컬러로 빛난다.**

본 앵커가 이후 모든 디자인 선택의 시험지이다 — 임의의 폰트·색·레이아웃이 본 앵커를 *돕는가* 아니면 *거스르는가*. 거스르면 채택하지 아니한다.

---

## 1. 제품 컨텍스트

| 축 | 정의 |
|---|---|
| **무엇** | 한국 4년제 편입 영어 시험 학습 플래너 PWA (헌법 제2조) |
| **누구** | 학원에 갈 수 없는 편입 영어 준비생 — 24M 원/년 학원의 격차를 자동화·플래닝으로 *완화* |
| **공간** | 태블릿 가로(1024×768) PWA · 데스크톱 함께 지원 · 모바일 폰은 폴드백 |
| **포지셔닝** | "정직한 플래너, 마법 아님" (헌법 제3조의2) — 합격 가능성·확률·점수 예측 일체 금지 |
| **방어 미학** | 학원 광고(다색·과대 카피·긴급성)의 시각적 정반대 |

---

## 2. 미학 방향 (Aesthetic)

- **방향**: "공부 노트 + 학술서" (Notebook + Academic book)
- **분위기**: 도서관·대학 강의노트·19세기 학술 출판물의 차분한 권위감 + 학생 일과 운영실
- **장식 수준**: **Intentional** — 가로 괘선 + 미세 종이 그레인 (1% 노이즈)
- **금지 장식**: 그라디언트, 블롭, 아이콘 서클, 데코 일러스트, 풀 컬러 밴드

### 미학을 따르는 결정의 시험지

선택지 A 와 B 가 있을 때 다음 질문에 답한다:

1. *학원 광고 같은 인상을 주는가?* → A 라면 거부, B 라면 선택지 (희소 컬러·차분한 톤)
2. *학생이 첫 5초에 "아, 학습 노트" 라고 인지하는가?* → 인지하면 채택
3. *Progress 점수 외에 컬러로 강조된 요소가 있는가?* → 있으면 거부 (액센트 단일 사용 규칙)

---

## 3. 타이포그래피 (Typography)

| 역할 | 영문 | 한글 | 비고 |
|---|---|---|---|
| Display·Hero | **Newsreader** | **Noto Serif KR** | 따뜻한 모던 세리프 |
| 본문·UI | **Geist** | **Pretendard** | 깨끗한 그로테스크 |
| 데이터·표 | Geist (`tnum 1`) | Pretendard (`tnum 1`) | tabular-nums = 숫자 폭 통일 (표·진척도 줄 맞춤) |
| 코드 | **JetBrains Mono** | — | OCR 디버그 등 희소 사용 |

### 로딩

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
@import url("https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Noto+Serif+KR:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
```

### 스케일

| 용도 | Size | Line-height | Letter-spacing |
|---|---|---|---|
| Display | `clamp(3.5rem, 7vw, 5.5rem)` | 0.95 | -0.025em |
| H1 | 2.25rem (36px) | 1.2 | -0.015em |
| H2 | 1.875rem (30px) | 1.3 | -0.01em |
| H3 (Panel title) | 1.25rem (20px) | 1.35 | -0.005em |
| Body 한글 | 1rem (16px) | **1.7** | 0 |
| Body 영문 | 1rem (16px) | **1.6** | 0 |
| Small | 0.875rem (14px) | 1.5 | 0 |
| Micro (eyebrow) | 0.75rem (12px) | 1.5 | **0.12em uppercase** |

### 폰트 스택 변수

```css
--font-serif-en: "Newsreader", "Noto Serif KR", Georgia, serif;
--font-serif-kr: "Noto Serif KR", "Newsreader", Georgia, serif;
--font-sans-en: "Geist", "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
--font-sans-kr: "Pretendard", "Geist", -apple-system, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

### 사용 규칙

1. **헤드라인·KPI 큰 숫자·인사말은 세리프**, 본문·라벨·버튼·표는 sans.
2. **숫자가 동일 컬럼에 정렬되는 위치는 모두 `tabular-nums`**: KPI 값, 표 셀, 진척도, 시간/일수, 차트 라벨.
3. **Newsreader italic** 은 강조·"맞게(Fit)" 같은 펀치라인 키워드, AI "F" 아이콘에만.
4. 한글 + 영문 혼용 시 `font-feature-settings: "ss01"` 등 stylistic alternates 는 Pretendard 만.

### 절대 금지 폰트

```
Inter · Roboto · Arial · Helvetica · Open Sans · Lato · Montserrat · Poppins ·
Space Grotesk · Comic Sans · Papyrus · Bradley Hand · Brush Script · Impact
```

이 폰트들은 본 디자인 시스템에서 *어떠한 사이즈·역할로도 등장하지 아니한다*. 컨버전스 트랩(SaaS 전반의 시각 컨버전스)을 만드는 폰트들이며, 본 시스템의 정체성과 정반대이다.

---

## 4. 색 (Color)

### 4.1 라이트 모드 (기본)

| Token | Hex | 용도 |
|---|---|---|
| `--color-bg` | `#FAF6EE` | 페이지 배경 (warm cream paper) |
| `--color-surface` | `#FFFAF1` | 카드·패널 표면 |
| `--color-surface-deep` | `#F3EDE0` | 입력 등 더 깊은 표면 |
| `--color-text` | `#1A2027` | 본문 텍스트 (deep ink) |
| `--color-text-muted` | `#6B6256` | 보조 텍스트 (warm gray) |
| `--color-rule` | `#E8E2D5` | 괘선·구분선 |
| `--color-rule-strong` | `#C8BFA8` | 입력 보더, 강한 괘선 |
| `--color-accent` | `#1F5C4A` | **Progress·CTA 전용** (deep evergreen) |
| `--color-accent-strong` | `#173F33` | accent hover 더 짙은 톤 |
| `--color-accent-soft` | `rgba(31, 92, 74, 0.1)` | accent 카드 배경 |
| `--color-warning` | `#B5862D` | (desaturated mustard) |
| `--color-error` | `#A03B2D` | (desaturated rust) |
| `--color-info` | `#2E4A6B` | (desaturated navy) |

### 4.2 다크 모드

| Token | Hex |
|---|---|
| `--color-bg` | `#11151B` |
| `--color-surface` | `#1A2027` |
| `--color-surface-deep` | `#232A33` |
| `--color-text` | `#F5EFE3` |
| `--color-text-muted` | `#948A7A` |
| `--color-rule` | `#2A323E` |
| `--color-rule-strong` | `#3D4654` |
| `--color-accent` | `#2D8B6F` (밝게 보정) |
| `--color-accent-strong` | `#46A98A` |
| `--color-accent-soft` | `rgba(45, 139, 111, 0.15)` |
| `--color-warning` | `#E0B458` |
| `--color-error` | `#D1685A` |
| `--color-info` | `#6088B5` |

### 4.3 액센트 사용 규칙 (위반 절대 금지)

`--color-accent` 는 *오직* 다음 5가지 위치에만 사용한다:

1. **Progress 게이지 채움** — KPI 카드의 진척 바, 차트 라인·점, 큰 숫자 (학습 진척도 KPI)
2. **오늘의 1차 액션 버튼** — primary CTA (예: "오늘 카드 학습 시작", "변환 시작")
3. **+N% 델타 숫자** — 학습 진척도 상승, 학습 시간 증가 등 *증가형 변화*
4. **활성 사이드바 메뉴 항목** — 현재 페이지 표시
5. **AI 추천 카드의 강조** — 보더, "F" 아이콘 배경

그 외 일체 컴포넌트 — 헤드라인, 카드 보더, 체크박스 비활성, 일반 아이콘, 배지, 링크 등 — 에는 *절대 등장하지 않는다*. 본 규칙 위반 시 디자인 일관성이 붕괴되며 "한 번만 빛난다" 의 메시지가 손상된다.

### 4.4 시맨틱 컬러 운영

`warning · error · info` 는 의도적으로 채도가 낮다. 학원 광고풍 다색 충돌을 피하기 위함이다. 차별화는 **(라벨 + 아이콘 + 좌측 보더 3px)** 3축으로만 한다 — 배경 채움이나 강한 밴드는 사용하지 아니한다.

### 4.5 종이 그레인

배경 `--color-bg` 위에 다음 1% 노이즈 텍스처를 얹는다:

```css
background-image: radial-gradient(circle at 1px 1px, rgba(26,32,39,0.018) 1px, transparent 0);
background-size: 4px 4px;
```

다크 모드: `rgba(255,255,255,0.012)`. 가까이 보면 종이 결, 멀리 보면 단색 — 컨텐츠와 경쟁하지 않는다.

---

## 5. 여백 (Spacing)

베이스 단위: **4px**

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

### 표준 적용

- 카드 패딩: `--space-xl` (24px)
- 섹션 간 간격: `--space-2xl` (32px)
- 페이지 여백 (태블릿): `--space-3xl` (48px)
- 사이드바 항목 간 간격: `--space-2xs` (2px)
- 폼 입력 패딩: `--space-md` `--space-lg` (12px 16px)

### 밀도 정책

**중간 밀도** — Notion 보다 살짝 여유롭고 Sunsama 보다 빠듯한 사이.
- 학습 데이터 표시는 dense (정보 밀도 우선)
- 인사말·AI 추천·플랜 진입은 spacious (감성·집중 우선)

---

## 6. 레이아웃 (Layout)

### 6.1 그리드

- **사이드바**: 240px 고정 폭, 좌측 고정
- **우측 콘텐츠**: 12-col grid
- **최대 콘텐츠 너비**: 1280px (페이지 wrapper)
- **태블릿 가로 1024×768 기준 디자인**, 데스크톱은 자연스럽게 늘어남, 모바일 세로는 단일 컬럼 폴드백

### 6.2 보더 라디우스

| Token | Value | 용도 |
|---|---|---|
| `--radius-sm` | 4px | 체크박스, 작은 배지, 코드 인라인 |
| `--radius-md` | 8px | 카드, 버튼, 입력, 패널 |
| `--radius-lg` | 12px | 모달, 큰 패널, 모의 디바이스 프레임 |
| `--radius-pill` | 999px | 토글, 진척 바, 칩 |

### 6.3 가로 괘선 (노트 메타포)

`--color-rule` 1px 두께, **콘텐츠 블록 간 구분에만** 사용한다 (카드 사이가 아니라 *섹션 사이*). 이 규칙이 그리드를 종이로 보이게 한다.

```css
.section-rule {
  height: 1px;
  background: var(--color-rule);
  margin-bottom: var(--space-2xl);
}
```

점선 (dashed)는 `dasharray "2,4"` 로 미세 단위 — 차트 grid line 등에 한정.

### 6.4 그림자

| Token | Value | 용도 |
|---|---|---|
| `--shadow-1` | `0 1px 0 rgba(26,32,39,.04), 0 1px 3px rgba(26,32,39,.04)` | 카드 hover (subtle lift) |
| `--shadow-2` | `0 2px 6px rgba(26,32,39,.05), 0 8px 24px rgba(26,32,39,.04)` | 모달, 모의 디바이스 프레임 |

다크 모드는 알파 채널 0.3-0.4 로 강화.

---

## 7. 모션 (Motion)

### 7.1 기본 (Functional motion)

| 종류 | Easing | Duration |
|---|---|---|
| 진입 | ease-out | 200ms |
| 퇴장 | ease-in | 150ms |
| 이동 | ease-in-out | 250ms |

페이드, 미세 슬라이드 (8px 이하), 보더 컬러 transition 만 사용.

포커스 링 (모든 입력 일관):
```css
box-shadow: 0 0 0 3px var(--color-accent-soft);
border-color: var(--color-accent);
```

### 7.2 한 표현 순간 (Intentional drama)

**Progress 점수 상승 애니메이션** (헌법 제8조 도파민 트리거):

- 진척 바 채움: **700ms ease-out**
- 숫자 카운트업: 50ms 마다 1씩 증가 (총 500-1000ms)
- 직접 동기화: 바와 숫자가 같은 종료 시점에 멈춤

```typescript
// 의사 코드
const animate = (from: number, to: number) => {
  const duration = 700;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = from + (to - from) * eased;
    setValue(Math.round(current));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
```

이 외에는 표현적 모션을 사용하지 아니한다 — *절제가 시그니처*.

---

## 8. 컴포넌트 결정

### 8.1 Button

| 변형 | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| Primary | `--color-accent` | `#FFFAF1` | none |
| Secondary | `--color-surface` | `--color-text` | `--color-rule-strong` |
| Ghost | transparent | `--color-text` | none |

Primary hover → `--color-accent-strong`. Secondary/Ghost hover → `--color-surface-deep`.

패딩: 12px 24px (sm/lg). Border-radius: `--radius-md`.

### 8.2 KPI Card

```
┌─────────────────────┐
│ 라벨 (sans 0.8125)  │
│                     │
│ 72 (serif 2.5rem)   │  ← Progress KPI 만 accent 색
│ /100 (sans muted)   │
│                     │
│ 어휘 80 · 오답 65   │
│ ▓▓▓▓▓▓▓░░░░░░░     │  ← Progress 바, accent
└─────────────────────┘
```

### 8.3 Form Input

- 보더 1px `--color-rule-strong`
- 배경 `--color-bg` (cream)
- 라벨 0.8125rem `--color-text-muted`, 입력 위에 위치
- 포커스: 보더 → `--color-accent`, 박스 섀도 → 3px `--color-accent-soft`

### 8.4 Alert

```
┌──┬───────────────────────────────────────┐
│██│ 알림 메시지 본문                      │
│██│                                       │
└──┴───────────────────────────────────────┘
 ↑ 좌측 3px (시맨틱 색)
```

배경 `--color-surface-deep`, 텍스트 `--color-text`. 시맨틱 색은 좌측 보더 3px 에만 등장.

### 8.5 AI Recommend Card

- 보더 1px `--color-accent`, 배경 `--color-accent-soft`
- 좌측 32px 원형 "F" 아이콘 (`--color-accent` 배경, Newsreader italic 흰색 글자)
- 우측: 세리프 제목 + sans 본문 + 액션 버튼 행

본 카드는 액센트 사용 규칙 5번에 해당 — 화면당 보통 1개만 등장.

### 8.6 Plan Row (오늘의 학습 플랜)

```
┌─┬──────────────────────────────────┬─────────┐
│✓│ 어휘 SRS · 35장 복습             │  ~ 25분 │  ← done: 체크 accent, 텍스트 line-through muted
└─┴──────────────────────────────────┴─────────┘
┌─┬──────────────────────────────────┬─────────┐
│ │ 학습 카드 · 12장 신규 학습       │  ~ 18분 │  ← 미완: 보더 rule-strong
└─┴──────────────────────────────────┴─────────┘
```

행 간 구분: `--color-rule` 1px 하단 보더.

### 8.7 Sidebar Nav Item

- 비활성: `--color-text-muted`, hover 시 `--color-surface-deep` 배경
- 활성: `--color-accent-soft` 배경 + `--color-accent` 텍스트 + 가중치 500
- 패딩: 12px, border-radius: `--radius-md`
- 아이콘 16px + 라벨 0.9375rem

---

## 9. 콘텐츠 가이드

### 9.1 어조

- 사용자에 대한 시스템 메시지: "주인님" 호칭 + 존댓말 (헌법 제0조)
- 화면 라벨: 간결한 명사형 ("학습 진척도", "오늘의 학습 플랜")
- AI 추천 본문: 제안형 ("...해드릴까요?"), 단정형·강제형 금지
- 알림: 사실 + 영향 (예: "학습 진척도가 +3 올랐습니다. 어제 69 → 오늘 72.")

### 9.2 숫자 표기

- 모든 학습 데이터는 `font-variant-numeric: tabular-nums`
- 단위는 한글, 숫자 뒤 작은 폰트로 분리
- 예: `72/100`, `1시간 24분`, `8일째`, `D-87`

### 9.3 마이크로카피 절대 금지

다음 표현은 일체 사용하지 아니한다 (헌법 제10조 정합):

```
합격 가능성 · 합격 확률 · 점수 예측 · 학교 핏 · 학교 적합도 ·
입시 점수 · 합격선 · 절대 평가 · 추정 컷
```

정식 표현은 **"학습 진척도", "Progress 점수"** 두 가지만 사용한다.

### 9.4 학교명 라벨

학교명을 표시할 때 *합격 데이터를 보유한 것처럼* 보일 수 있는 표현을 사용하지 아니한다. UI 에서 노출 가능한 정보는 공개된 시험일·과목 구성·문항 수에 한정한다 (헌법 제15조).

---

## 10. 반응형·접근성

### 10.1 브레이크포인트

| 이름 | 폭 | 적용 |
|---|---|---|
| Tablet (기본) | 1024×768 | 사이드바 240px + 12-col 그리드 |
| Desktop | 1280px+ | 사이드바 그대로, 콘텐츠 폭만 늘어남 |
| Mobile | <900px | 사이드바 접힘 (햄버거), 단일 컬럼 |

### 10.2 접근성

- **명도 대비**: 본 모든 토큰 조합은 WCAG AA (4.5:1) 이상. `--color-text` on `--color-bg` 는 약 12.8:1.
- **포커스 링**: 모든 입력에 일관된 3px `--color-accent-soft` + 보더 `--color-accent`
- **선호 모션 감소**: `prefers-reduced-motion: reduce` 시 진척 카운트업 즉시 종료, 페이드만 유지
- **선호 컬러 스킴**: `prefers-color-scheme: dark` 자동 감지 + 사용자 토글 우선

---

## 11. 미리보기 자산

- HTML 미리보기: `~/.gstack/projects/Cazeko-vibe2026-new/designs/design-system-20260505/preview.html`
- 라이트 모드 스크린샷: `~/.gstack/projects/Cazeko-vibe2026-new/designs/design-system-20260505/preview-light.png`
- 다크 모드 스크린샷: `~/.gstack/projects/Cazeko-vibe2026-new/designs/design-system-20260505/preview-dark.png`

이 미리보기는 본 문서의 *살아있는 명세*이며, 정의된 CSS 변수가 그대로 `fitly/src/app/globals.css` 또는 Tailwind 테마 토큰으로 이식 가능하다.

---

## 12. SAFE / RISK 의도

### SAFE — 카테고리 베이스라인 (의도적 보존)
1. 사이드바 + 우측 카드 그리드 (모든 생산성 툴 표준)
2. tabular-nums 정렬 데이터 (진지한 데이터 툴 table-stakes)
3. 라이트/다크 양 모드 (PWA 기본 기대)

### RISK — 카테고리 이탈 (의도적 차별화)
1. **앱 *안* 헤드라인까지 세리프** — Sunsama 등 경쟁자는 마케팅 카피에만 세리프, 앱은 sans. 본 시스템은 KPI 카드 라벨·인사말·오늘 날짜까지 세리프. 권위감 + 차분함 획득. 작은 사이즈 렌더링·한글 페어링 디테일이 비용.
2. **단일 액센트 `#1F5C4A` — 진척에만** — 경쟁 툴은 2-4 액센트. 우린 한 색 한 용도. "녹색 = 내 진척" 즉각 학습. 알림 심각도 구분이 약해지는 비용은 라벨·아이콘으로 보강.
3. **콘텐츠 블록 사이 가로 괘선 (노트 메타포 직접화)** — SaaS 거의 안 함. 학생이 첫 화면에서 "아, 학습 노트" 인지. "구식" 우려는 카드 모서리·쉐도우·spacing 디테일로 현대성 보강.

이 RISK 들이 채택된 사유와 검증된 사용자 결정은 11항(미리보기) 의 라이트/다크 스크린샷에서 시각적으로 확인 가능하다.

---

## 13. 결정 로그

| 일자 | 결정 | 사유 |
|---|---|---|
| 2026-05-05 | 디자인 시스템 v1 신설 | `/design-consultation` 스킬 통해 헌법 v2.0 컨셉 피벗 정합 시각 시스템 정의 |
| 2026-05-05 | 메모러블 앵커 = 공책+세리프+진척 단색 | D3 에서 사용자 명시 선택 (vs A 잉크모노 / C 타이포가 UI) |
| 2026-05-05 | 폰트 = Newsreader+Noto Serif KR / Geist+Pretendard | 한·영 페어링, Inter·Roboto·Space Grotesk 등 컨버전스 트랩 회피 |
| 2026-05-05 | 액센트 = `#1F5C4A` (deep evergreen), 단일 사용 | 진척·CTA·델타에만, 의미의 희소성 = 메시지 |
| 2026-05-05 | 라이트 우선 + 다크 토큰 매핑 | 학습 도구는 라이트 기본이 표준, 다크는 야간 학습 지원 |
| 2026-05-05 | 미리보기 = HTML (AI 목업 아님) | OpenAI 키 부재 + HTML 이 구현으로 직접 계승 가능 |
| 2026-05-05 | 모션 = minimal-functional + Progress 700ms ease-out | 절제가 시그니처, 한 표현 순간만 — 헌법 제8조 도파민 트리거 정합 |
| 2026-05-05 | 종이 그레인 1% 노이즈 채택 | 노트 메타포 강화, 콘텐츠와 경쟁하지 않는 수준 |
| 2026-05-05 | tabular-nums 모든 학습 데이터 의무 | 진지한 데이터 툴 table-stakes — 줄 맞춤 = 신뢰감 |
