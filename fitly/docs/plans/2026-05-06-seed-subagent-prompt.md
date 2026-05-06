# Seed Subagent Prompt 표준

| 항목 | 값 |
|------|----|
| 일자 | 2026-05-06 |
| 헌법 버전 | v3.3 |
| 사용처 | 오케스트레이터 채팅이 `Agent` 도구로 22개 subagent 호출 시 prompt |
| Subagent 모델 | `opus` (Claude Code 환경에서 4.7 1M context 자동 적용) |
| Subagent 단위 | **1 풀세트 (3 시험지: essay/A/B)** = 1 subagent |

---

## 1. 표준 prompt 텍스트 (subagent에게 전달)

다음 텍스트를 `Agent({ prompt: ..., subagent_type: "general-purpose", model: "opus" })` 의 `prompt` 인자에 넣는다 (변수 치환 후).

```
당신은 fitly v3.3 시드 파이프라인의 풀세트 처리 subagent입니다.
이 prompt 외부의 사용자에게 직접 질문할 권한은 없습니다.
오케스트레이터에게만 결과를 반환합니다.

═══════════════════════════════════
의무 read 파일 (작업 시작 전)
═══════════════════════════════════
1. /home/jovyan/work/fitly/CLAUDE.md
2. /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/docs/plans/2026-05-06-seed-pipeline-implementation.md §4 (특히 §4.3·§4.4·§4.5·§4.5.1)
3. /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/docs/plans/2026-05-06-seed-execution-handoff.md §2.3·§5·§6·§9

═══════════════════════════════════
처리 대상 (오케스트레이터가 치환)
═══════════════════════════════════
연도: ${YEAR}
풀세트:
- /home/jovyan/work/fitly/kice_pdfs/${YEAR}-essay.pdf
- /home/jovyan/work/fitly/kice_pdfs/${YEAR}-A.pdf
- /home/jovyan/work/fitly/kice_pdfs/${YEAR}-B.pdf

산출 위치:
- /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/data/papers/${YEAR}-essay/items.json
- /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/data/papers/${YEAR}-A/items.json
- /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/data/papers/${YEAR}-B/items.json

═══════════════════════════════════
헌법 v3.3 절대 원칙 (위반 시 작업 무효)
═══════════════════════════════════

[원칙 1] 시험 문제 본문(stem)은 절대 만들지 마라.
- stem_text 는 unpdf 추출 결과의 그대로 슬라이스
- LLM이 만든 stem 출력은 무시
- 자가 검증: stem_text == raw_text[start_offset:end_offset]

[원칙 2] 답안·해설은 분리 (answer_md / explanation_md).
- answer_md: 학생이 시험에서 쓸 분량 (서술 80~250자, 논술 1500~2400자)
- explanation_md: 학습 보조 해설 (서술 300~600자)

[원칙 3] 사용자에게 질문 금지, 모든 의문은 fallback 적용.
- 보수적 default 적용
- "extraction_issues": [...] 메모로 보존
- verified_answer=false 로 시드 (default)
- 다음 단계로 진행

═══════════════════════════════════
작업 절차 (3 시험지 각각 반복)
═══════════════════════════════════

[Step 02a] unpdf 텍스트 추출
$ node /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/lib/extract-pdf-pages.mjs /home/jovyan/work/fitly/kice_pdfs/${YEAR}-${SESSION}.pdf > /tmp/seed-${YEAR}-${SESSION}/raw_text.txt

[Step 02b] pdftocairo 페이지 PNG
$ mkdir -p /tmp/seed-${YEAR}-${SESSION}/pages
$ pdftocairo -png -r 150 /home/jovyan/work/fitly/kice_pdfs/${YEAR}-${SESSION}.pdf /tmp/seed-${YEAR}-${SESSION}/pages/page

[Step 03] 페이지별 PNG를 Read 도구로 시각 확인 + raw_text.txt 에서 문항 위치(offset) 식별
- 페이지에 보이는 문항 번호별로 raw_text.txt 의 시작·끝 character offset 식별
- stem_text = raw_text[start:end] 로 강제 (LLM이 만든 본문 텍스트 X)

[Step 04] 각 문항에 대해 분석·태깅·답안·해설 작성
- domains[], bloom, keywords[]
- answer_md (시험 분량)
- explanation_md (학습 보조)
- 본문(stem_text) 다시 만들지 마라

[Step 05] items.json Write
- /home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/data/papers/${YEAR}-${SESSION}/items.json
- 스키마는 §4.4·§4.5 참조

[Step 06] 자가 검증
- stem_text 가 raw_text 슬라이스인가?
- answer_md / explanation_md 분량이 §4.5.1 표준 안인가?
- 의문점이 있으면 extraction_issues 에 메모

[Step 07] git commit (subagent 종료 직전)
$ cd /home/jovyan/work/.worktrees/v3-seed-pipeline
$ git add fitly/scripts/seed/data/papers/${YEAR}-*/
$ git commit -m "feat(seed): ${YEAR} 풀세트 시드 (v3.3)"

═══════════════════════════════════
출력 (오케스트레이터에게 반환)
═══════════════════════════════════

JSON 형식 1개:
{
  "year": ${YEAR},
  "papers_processed": ["essay", "A", "B"],
  "items_total": <int>,
  "items_with_issues": <int>,
  "extraction_issues_summary": ["...", "..."],
  "commit_sha": "<git rev-parse HEAD>",
  "self_check_passed": true | false
}

400 단어 이하로 추가 코멘트 (필요시).
```

---

## 2. 오케스트레이터의 Agent 호출 예시

오케스트레이터 채팅이 다음과 같이 5개 subagent 병렬 호출:

```typescript
// Round 1 (예시 — 5 subagent 병렬, 한 메시지에 5 Agent 호출)
const rounds = [
  { round: 1, years: [2025, 2024, 2023, 2022, 2021] },
  { round: 2, years: [2020, 2019, 2018, 2017, 2016] },
  { round: 3, years: [2015, 2014, 2013, 2008, 2007] },  // Phase 3 일부
  { round: 4, years: [2006, 2005, 2004, 2003, 2001] },  // Phase 3 잔여
  // Phase 4 (combined·dedup·DB) 는 별도 단계
];

for (const r of rounds) {
  await Promise.all(r.years.map(year => Agent({
    description: `Seed ${year} 풀세트`,
    subagent_type: "general-purpose",
    model: "opus",
    prompt: PROMPT_TEMPLATE.replace(/\$\{YEAR\}/g, year.toString()),
  })));
}
```

---

## 3. Round 0 — 2026 재시드 (검증 전용)

오케스트레이터 채팅이 첫 라운드 진입 전 단일 subagent로 2026 재시드를 검증한다.

**Round 0 prompt 변형**: 위 표준 prompt에서 `${YEAR} = 2026`. 단, 추가 검증:

```
- 결과 items.json 의 stem_text 와 unpdf raw_text 슬라이스가 일치하는가? (코드 assert)
- answer_md / explanation_md 분량이 §4.5.1 표준 안인가?
- ARCHIVED.md 가 있는 디렉토리에 새 items.json 을 Write 할 때 기존 items.json 은 items-archived.json 으로 mv
```

Round 0 통과 조건:
- 자가 검증 7항 모두 통과
- 운영자(주인님) 1차 확인 후 Round 1 진입 승인

---

## 4. Phase 3 객관식 시대 처리 (Round 3·4)

Phase 3 (2002~2013) 풀세트는 객관식 문항 위주이므로 **풀이 카드 X, 개념 정리 노트만** (헌법 v3.2 8항).

subagent prompt 추가 분기:
```
${YEAR} <= 2013 인 경우:
- 모든 객관식 문항의 stem_text 는 동일하게 보존 (PDF 원본)
- skip_quiz_card=true 플래그
- answer_md = 정답 (보기 번호 + 한 문장)
- explanation_md = 개념 정리 노트 (정의·핵심 요소·관련 키워드)
- domains·bloom·keywords 그대로 태깅
```

---

## 5. Phase 4 — dedup + DB 적재

Round 4가 끝난 후 별도 단계 (subagent 1개):

1. 모든 papers/*/items.json 의 keywords 통합 (`keyword-dedup.ts` 결과)
2. 빈도 ≥ 2 키워드의 개념 정리 노트 생성 (LLM)
3. DB 적재 스크립트 실행 (drizzle, exam_papers + exam_items + cards)

---

## 6. 운영자 검수 단계 (Round 4 종료 후)

자동화 단계 종료 후 운영자(주인님) 작업:

1. **답안·해설 검수** — 풀이 카드 (서술형, ≈325개) 의 answer_md 1차 검증, verified_answer=true 로 승격
2. **extraction_issues 정정** — subagent 메모를 보고 본문 정확성 재확인
3. **Round 0 ARCHIVED 정정** — 2026 재시드 결과로 풀스코프 일관성 점검

---

## 7. 위반 감지·재시도

자가 검증 실패 시 subagent는 다음을 시도:

| 실패 | 재시도 |
|------|-------|
| stem_text != raw_text 슬라이스 | offset 재계산 + 재slice |
| answer_md 분량 표준 위반 | 재작성 1회 |
| explanation_md 분량 표준 위반 | 재작성 1회 |
| 3회 시도 후에도 실패 | extraction_issues 메모 + verified_answer=false 로 시드 |

> 무한 루프 방지 — 같은 step 3회 시도 후에는 fallback.
