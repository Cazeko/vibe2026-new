# 로그인 페이지 → 랜딩 hero 전환 — 공책 메타포 + three.js

> **상태**: 디자인 결정 합의 (2026-05-06 brainstorming) · 사용자 명시 승인 대기 (헌법 제16조의2)
> **시행규칙**: `.claude/rules/31_skill_mapping.md` — `senior-frontend` · `frontend-design` · `ui-ux-pro-max` 스킬 활용
> **scope**: `/login` (그리고 `/signup`) 한 페이지 한정. main app(`(main)/*`) 절제 미학은 *변경 없음*.

---

## 0. 메모러블 앵커

> **공책 가로 괘선 위에 만년필이 펀치라인을 *쓰는* 한 순간.**

랜딩 진입 첫 5초 시각 임팩트의 정체성. 헌법 v3.0 메모러블 앵커("공책 가로 괘선 + 세리프 헤드라인 + 학습 진척도만 컬러로 빛난다")의 *시각적 풀이*이며, "사설 인강 광고풍의 정반대"(헌법 §2)라는 방어 미학을 *위반하지 않으면서* three.js의 시각 임팩트를 사용한다.

---

## 1. 페이지 구성 (`/login` · `/signup` 공통)

### 1.1 데스크톱 (≥1024px)

좌우 분할.

| 영역 | 폭 | 내용 |
|---|---|---|
| 좌측 hero | 60% | 가로 괘선 노트 페이지(three.js) + 만년필 글쓰기 모션 + 펀치라인 |
| 우측 form 카드 | 40% (max 480px) | F 로고 + "로그인" / "회원가입" 헤더 + AuthForm |

배경: body의 cream(#FAF6EE) + 1% 종이 그레인 그대로. 좌우 영역은 *동일 종이 위*에 자연스럽게 분리 (보더 X, 미세한 색상 톤 차이만).

### 1.2 태블릿 (768~1023px)

좌우 분할 그대로, 비율 50:50. hero 영역의 three.js scene만 살짝 축소.

### 1.3 모바일 (<768px)

상하 배치. hero가 위(30vh), form이 아래(form 콘텐츠 자연 높이). hero는 정적 SVG 폴드백(three.js 미로드)으로 모바일 대역폭 보호.

### 1.4 prefers-reduced-motion

three.js scene 자체를 로드하지 않고 정적 SVG로 펀치라인 + 가로 괘선만 표시. 헌법 §10.2 + DESIGN.md §10.2 정합.

---

## 2. 좌측 hero — 만년필 글쓰기 모션 명세

### 2.1 시점

Side-isometric — 종이 평면을 약 12~15도 기울여 옆에서 살짝 내려다보는 시점. 종이가 살짝 입체로 보이지만 글자는 정면에 가깝게 읽힌다.

### 2.2 만년필

- **표현**: 미니멀 검은 라인 실루엣 (사실적 텍스처·그림자 X). 길이 약 14cm 비율, 끝(닙)이 종이에 닿는 위치.
- **색**: `--color-text` (#1A2027 deep ink). 단색.
- **3D 모델**: low-poly cylinder + cone 조합 또는 SVG path를 three.js로 extrude. ~200 verts.

### 2.3 종이 + 가로 괘선

- **종이 평면**: cream(#FAF6EE) 색의 single quad. 입자 노이즈 셰이더로 미세한 종이 결.
- **가로 괘선**: `--color-rule` (#E8E2D5) 1px 선이 32px 간격으로 (DESIGN.md §6.3 가로 괘선 정합). 펀치라인이 한 줄로 그어지는 괘선 위에 위치.
- **여백**: 종이 평면 좌우 padding 충분 — 펀치라인이 폭의 70% 차지.

### 2.4 펀치라인 글쓰기 시퀀스

- **텍스트**: "임용은 열심히 하는 게 아니라, **맞게(Fit)** 하는 게임입니다." (펀치라인 헌법 제4조 — 변경 절대 금지)
- **속도**: 한 글자당 약 80~100ms → 전체 약 2.4~3.0초 (28자 기준).
- **잉크 trail**: evergreen(#1F5C4A). 단 "맞게(Fit)" 부분만 굵게(font-weight 600) + 같은 evergreen.
  - **참고**: evergreen은 헌법 §4.3 "Progress·CTA·델타·active 메뉴·AI 추천 카드 5번"에 한정. 본 글쓰기 잉크 trail은 *6번째 엄선된 사용처*로 추가하는 결정 (제16조의2 정합으로 사용자 명시 승인 필요). 의미: "학습이 시작되는 첫 잉크" — 등록 후 학습으로 진입하는 사용자 여정의 *시작 기호*.
  - 검은 잉크(#1A2027)로도 가능하나 메모러블 앵커의 "학습 진척도만 컬러로 빛난다"가 *학습 진입 자체*에도 확장된다는 해석.
- **잉크 흡수 효과**: 글자가 그려진 직후 미세한 번짐 (±0.5px alpha 전이) → 종이가 *잉크를 빨아들인* 인상. fragment shader로 처리.
- **easing**: 글자 단위 ease-out, 전체 timing은 cubic-bezier(0.16, 1, 0.3, 1).

### 2.5 글쓰기 완료 후

- 만년필이 마지막 글자 옆 약 24px 떨어진 위치에 정지.
- 마우스가 hero 영역 위에서 움직이면 만년필 끝이 ±2~3px parallax (마우스 위치 따라 미세하게 흔들림). 200ms ease-out.
- form 영역 마우스 시 parallax 정지 (시선 분산 회피).

### 2.6 첫 진입 vs 재진입

- 첫 진입 시 글쓰기 모션 풀 재생.
- session storage에 마지막 재생 시각 기록 → 같은 세션 내 `/login` ↔ `/signup` 전환 시 글쓰기 *생략하고 정적 펀치라인*만 노출 (불필요한 반복 회피).

---

## 3. 우측 form 카드 — 양식 변경

기존 form은 그대로 유지(AuthForm 컴포넌트 재사용). 컨테이너만 갱신:

```
[F 로고]
로그인 / 회원가입 (font-serif text-3xl)
[AuthForm]
```

**카드 양식**:
- 단단한 `bg-card` (`--color-surface` #FFFAF1) — 본 세션 fix와 동일하게 종이 그레인 차단.
- 보더 1px `--color-rule`.
- 패딩 32px(`--space-2xl`) + max-w 400px + 수직 중앙 정렬.
- 그림자 `--shadow-1` (subtle lift).

---

## 4. 기술 결정

### 4.1 three.js dynamic import

```tsx
import dynamic from "next/dynamic";

const PenWritingCanvas = dynamic(
  () => import("@/components/feature/auth/pen-writing-canvas"),
  { ssr: false, loading: () => <StaticHeroFallback /> }
);
```

- **bundle size 격리**: three.js는 `/login` `/signup`에서만 로드. main app(`(main)/*`)에 영향 X.
- **SSR X**: WebGL은 client only. SSR 시 fallback 정적 SVG.
- **prefers-reduced-motion 감지**: client mount 시 `window.matchMedia('(prefers-reduced-motion: reduce)').matches`이면 dynamic import 자체를 건너뛰고 fallback 표시.
- **모바일 감지**: `window.innerWidth < 768`이면 fallback 표시. resize 시 동기화.

### 4.2 라이브러리 선택

- `three` (~150KB gz). 직접 사용. `@react-three/fiber` 같은 wrapper는 *과추상화* — single scene 한 페이지 내에서는 raw three.js가 더 가벼움.
- 글쓰기 trail은 `THREE.Line` + 시간 기반 verts append. 또는 `MeshLine` 라이브러리(~5KB) 추가 검토.
- 잉크 흡수 셰이더: GLSL fragment shader — 약 30~50줄. 직접 작성.

### 4.3 성능 목표

| 지표 | 목표 |
|---|---|
| LCP | < 2.5s (form 카드 LCP 우선, hero는 lazy) |
| INP | < 200ms |
| CLS | 0 (hero 영역은 고정 크기) |
| three.js bundle | < 200KB gz (tree-shake) |
| 첫 진입 글쓰기 시작 | 페이지 로드 후 0.5~1s |

### 4.4 접근성

- hero 영역 `aria-hidden="true"` (장식 — 스크린 리더 무시).
- 펀치라인은 form 카드 헤더 위에 *별도 텍스트로* 노출 (스크린 리더 + reduced-motion 사용자가 메시지를 읽을 수 있게).
- 키보드 nav: form 카드 진입 시 첫 input에 focus. hero는 keyboard-traversable X.

---

## 5. 컴포넌트 구조

```
src/
├── app/(auth)/
│   ├── layout.tsx                      # (신설) 좌우 분할 layout — login·signup 공유
│   ├── login/page.tsx                  # form 영역만 (hero는 layout이 그린다)
│   └── signup/page.tsx                 # form 영역만
└── components/feature/auth/
    ├── auth-form.tsx                   # 기존
    ├── login-hero.tsx                  # (신설) hero 컨테이너 + viewport·motion 분기
    ├── pen-writing-canvas.tsx          # (신설) three.js scene (dynamic import)
    └── static-hero-fallback.tsx        # (신설) 정적 SVG fallback
```

`(auth)/layout.tsx`로 이동 — 두 페이지(login, signup) 모두 같은 hero 사용. 펀치라인은 동일.

---

## 6. 작업 단계 (implementation)

1. **헌법 §4.3 6번째 사용처 추가 발의** — DESIGN.md 갱신 (사용자 승인 후) + 헌법 제16조의2 정합으로 사용자 명시 승인 *필수*.
2. **PenWritingCanvas 신설** (three.js scene + 만년필 mesh + 종이 plane + 가로 괘선 + 글쓰기 trail + 잉크 흡수 셰이더 + parallax handler).
3. **StaticHeroFallback 신설** (SVG로 가로 괘선 + 펀치라인 정적 표시. reduced-motion·모바일·SSR 시 노출).
4. **LoginHero 컴포넌트 신설** (viewport·motion media query 감지 + dynamic import 분기 + session storage 첫 진입 체크).
5. **(auth)/layout.tsx 신설** + login/signup page.tsx 갱신 (form 영역만 남기고 hero는 layout으로 이동).
6. **빌드 검증** — bundle analyzer로 three.js가 (auth) 청크에만 들어갔는지 확인.

총 추정 시간: 2~3시간 (three.js scene 1~1.5시간 + fallback·layout 0.5시간 + 검증 0.5시간).

---

## 7. 결정 로그 (brainstorming 2026-05-06)

| Q | 결정 | 사유 |
|---|---|---|
| Q1 | 공책 메타포 풀이 | 메모러블 앵커 정합 + Fitly 차별화 |
| Q2 | 좌우 분할 (hero / form) | 데스크톱 임팩트 + 모바일 폴드백 |
| Q3 | 만년필 글쓰기 모션 | 한 메모러블 모먼트 + 펀치라인 직접 시각화 |
| Q4 | Side-isometric + 미니멀 라인 만년필 | 절제 미학 + evergreen 잉크 trail |
| Q5 | 완료 후 만년필 떠 있고 마우스 parallax | 살아있는 노트 인상 + 산만 X |
| Q6 | 가로 괘선 노트 페이지 | 헌법 v3.0 메모러블 앵커 정확히 시각화 |

---

## 8. NOT in scope

- 마케팅 페이지 풀 구성(features 3섹션·신뢰 증표·푸터 등) — 본 plan은 *로그인/회원가입 hero* 한정. 마케팅 페이지가 필요하면 별도 plan으로.
- 다른 페이지의 three.js — main app은 절제 미학 그대로 유지.
- A/B 테스트·analytics — 측정 도구는 별도 결정.

---

## 9. 사용자 승인 필요 사항 (헌법 제16조의2)

1. **DESIGN.md §4.3 evergreen 5번 한정 → 6번째 사용처(랜딩 잉크 trail) 추가** 발의. 헌법 정합으로 사용자 명시 승인 후 DESIGN.md 갱신 commit.
2. **위 1~5절 전체 디자인 결정** 검토 + 합의. 본 문서 자체에 합의 표시.
3. (선택) 글쓰기 trail 색을 evergreen 대신 deep ink(#1A2027)로 가져갈지 — DESIGN.md 위반 회피하는 보수 옵션.

---

## 10. 결정 이력

| 일자 | 결정 |
|---|---|
| 2026-05-06 | brainstorming 통해 Q1~Q6 합의 (B·B·A·B·B·A) |
| (대기) | 사용자 명시 승인 + DESIGN.md §4.3 6번째 사용처 발의 채택 |
| (대기) | implementation 시작 |
