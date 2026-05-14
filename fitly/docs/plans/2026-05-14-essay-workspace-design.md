# AI 서술형 학습 워크스페이스 — 점진 격상 설계 (2026-05-14)

> **합의 근거** — 2026-05-14 brainstorming 라운드. 풀이 트랙(`/study/quiz`, `/study/mistake`) 페이지의 전면 재설계 합의.
> **헌법 정합** — 제16조 (스코프 보호) + 시행규칙 32 제34조 — "기존 풀이 트랙 다듬기" 6단계 분할.
> **위계** — 시행규칙층 동급 (제38조 6번 — `docs/plans/`).

## 1. 배경

기존 `/study/quiz`, `/study/mistake` 의 채점 직후 화면은 단순 *"답안 보기"* 위주이다. 정보가 한 번에 너무 많이 노출되고, 모범답안이 긴 텍스트 덩어리라 피드백 중심 학습이 어렵다.

본 시리즈는 풀이 트랙을 **AI 기반 서술형 학습 워크스페이스** (Notion + Cursor + PDF Viewer + AI 튜터 결합) 로 격상한다.

## 2. 합의 결정 4가지

| 항목 | 결정 |
|---|---|
| 추진 방식 | **B. 점진 시리즈** — 6개 작은 PR 분할 |
| AI 채점 점수 | **B. 정성 피드백만** — "18/20" 류 절대 점수 X (헌법 제3조의2 정직성 정합) |
| LLM 모델 | **Gemini 3.0 Flash** — Pro > Flash > Flash Lite 계층의 Flash 티어. 카드당 ~ 0.5원 |
| PR 분할 | **A. 세분 6개** — 회귀 격리 최강 |

## 3. 6개 PR 매핑

| PR | 제목 | 핵심 변경 | LLM | DB |
|---|---|---|---|---|
| 1 | 워크스페이스 골격(탭화) | WorkspaceTopbar + AnalysisPanel + 기존 모범답안/해설 탭 이동 | X | X |
| 2 | AI 백엔드 + 캐시 | `user_card_ai_analysis` 0016 + Gemini wrapper + attempt_hash | O | O |
| 3 | AI 총평 탭 | 강점/보완점/누락 키워드 카드 + 색상(초록·주황·빨강) | O | X |
| 4 | 키워드 비교 탭 | 모범↔내답 매트릭스 + 배지 ✔✘ | O | X |
| 5 | 답안 diff 탭 | Cursor 스타일 라인 단위 하이라이트 | O | X |
| 6 | AI 학습 도우미 패널 | 플로팅 FAB + 액션 5종 + 챗봇 (헌법 §16 개정 발의 동반) | O | X |

## 4. 컴포넌트 계층 (PR 1 기준)

```
StudyCardForm (wrapper)
├── WorkspaceTopbar     [PR 1] 진행률 + 카드 라벨 + 학습 상태
├── SplitView
│   ├── ProblemPane    [PR 1] 기존 stemCard + 답안 입력 통합
│   └── AnalysisPanel  [PR 1] 탭 컨테이너 — 5탭
│       ├── OverviewTab     [PR 3] placeholder
│       ├── KeywordsTab     [PR 4] placeholder
│       ├── DiffTab         [PR 5] placeholder
│       ├── ReferenceTab    [PR 1] 기존 backMd + 형광펜·블라인드 보존
│       └── ExplanationTab  [PR 1] 해설 placeholder
├── GradingBar              이미 PR #36 슬림화 완료
└── AssistantFab        [PR 6] 플로팅 + 액션 드로어
```

### PR 1 잠금 정책

- 채점 전(`revealed === false`) — AnalysisPanel 모든 탭 잠금 표시 (자물쇠 아이콘 + "채점 후 활성화" 안내)
- 채점 후 — ReferenceTab(기본 활성) + ExplanationTab 열림. OverviewTab/KeywordsTab/DiffTab 은 "준비 중" placeholder (PR 2~5 에서 활성화)

## 5. 데이터 모델 (PR 2)

```
user_card_ai_analysis  (0016)
├── id, user_id, card_id
├── attempt_hash (SHA-1 of normalized answer)
├── overview_json (강점[] / 보완[] / 누락_키워드[])
├── keywords_json (모범_키워드[] + 매칭_여부)
├── diff_json (Cursor diff 구조)
├── model ("gemini-3.0-flash")
└── created_at
unique (user_id, card_id, attempt_hash)
```

## 6. 헌법 정합 확정

- **제16조 (스코프 보호) + 시행규칙 32 제34조** — PR 1~5 모두 "풀이 트랙 다듬기" 로 해석
- **제3조의2 (정직성)** — 점수 표기 X 로 외부 채점 기준 추정 회피
- **제18조 (AI 모델)** — Gemini 단일 공급자 + 3.0 Flash 신모델 자동 업그레이드 (매트릭스 갱신은 PR 6에서)
- **제16조의2 (디자인 시스템)** — 모든 신규 컴포넌트는 `fitly/DESIGN.md` 토큰 (evergreen / rule / cream-soft 등) 만 사용
- **제4조의3 (한글 줄바꿈)** — 탭 라벨·placeholder 안내는 의미 단위 의도된 줄바꿈
- **PR 6 는 신규 모듈 성격** — `docs/proposals/v3.6-essay-workspace.md` 헌법 개정 발의 동반

## 7. 사용자 확인 사항 (모두 OK)

- a) 채점 전엔 "모범답안" 탭 잠금 / 채점 후 "AI 총평" 자동 활성화 — OK
- b) 형광펜·블라인드·태그는 ReferenceTab 안에서 그대로 동작 보존 — OK
- c) 추가 요청 없음 — OK

## 8. 사용자 추가 요청 (hotfix #38 적용 완료)

- 풀이/오답 트랙 가로 여백 60%+ 문제 → `max-w-3xl` → `max-w-6xl` 확장 (#38 머지됨)
- PR 1 페이지 레이아웃 전면 개편 시 max-w 정책 재검토 — 본 PR 에서는 기존 `max-w-6xl` 유지

## 9. 시행일

본 설계 문서는 **2026-05-14** 부터 시행한다. 각 PR 머지 시점에 본 문서 9절 PR 추적 표를 갱신한다.

### PR 추적

| PR | 상태 | 머지 SHA |
|---|---|---|
| 1 | 진행 중 | — |
| 2 | 대기 | — |
| 3 | 대기 | — |
| 4 | 대기 | — |
| 5 | 대기 | — |
| 6 | 대기 (개정 발의 동반) | — |
