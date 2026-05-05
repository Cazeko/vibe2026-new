# 시드 풀스코프 실행 — 세션 핸드오프 가이드

| 항목 | 값 |
|------|----|
| 일자 | 2026-05-06 |
| 헌법 버전 | **v3.3** (제13조의2 9항 — 본문 100% 정확성 보장, LLM이 본문 생성 X) |
| 운영 모델 | claude-opus-4-7 (1M context) — Anthropic 채팅 직접 처리 |
| 처리 트랙 | 헌법 v3.1 제18조 B-단기 |
| 선행 dry-run | 2026 풀세트 (essay/A/B) — Appendix B |
| 산출 위치 | `fitly/scripts/seed/data/papers/{year}-{session}/items.json` |

---

## 1. 새 세션 시작 시 의무 read 파일

매 세션 시작 시 다음 파일을 읽고 시작한다.

| 우선순위 | 파일 | 목적 |
|---------|------|------|
| 1 | `fitly/CLAUDE.md` | 헌법 (호칭·존댓말·정직성·모델 매트릭스) |
| 2 | **본 파일** (`docs/plans/2026-05-06-seed-execution-handoff.md`) | 세션 작업 가이드 |
| 3 | `docs/plans/2026-05-06-seed-pipeline-implementation.md` §4.5 | 모범답안 품질 표준 |
| 4 | `docs/plans/2026-05-06-seed-pipeline-implementation.md` Appendix B | dry-run 결과 (2026 풀세트) |
| 5 | (해당 세션 처리 PDF의 이전 연도 시드 1개) | 영역별 모범답안 톤 참고 |

---

## 2. 세션 분할 plan (총 22 세션)

### 2.1 우선순위 정책

1. **최신 5년 우선** — 2022~2026 풀세트가 가장 가치 있음 (현 출제 트렌드 반영)
2. **서술형 도입 후** (2014~2026) 풀세트 다음
3. **객관식 시대** (2002~2013) 마지막 — 풀이 X, 키워드 카드 본문(개념 정리 노트)만 생성
4. **통합본 (2009/2010/2011)** — 운영자 수동 분리 후 처리

### 2.2 세션 매핑

```
[Phase 1 — 최신 5년 풀세트 (2022~2026)]
  Session 01:  2026 essay + 2026 A + 2026 B   ← (✅ 2026 dry-run 완료)
  Session 02:  2025 essay + 2025 A + 2025 B
  Session 03:  2024 essay + 2024 A + 2024 B
  Session 04:  2023 essay + 2023 A + 2023 B
  Session 05:  2022 essay + 2022 A + 2022 B

[Phase 2 — 서술형 안정기 (2014~2021)]
  Session 06:  2021 essay + 2021 A + 2021 B
  Session 07:  2020 essay + 2020 A + 2020 B
  Session 08:  2019 essay + 2019 A + 2019 B
  Session 09:  2018 essay + 2018 A + 2018 B
  Session 10:  2017 essay + 2017 A + 2017 B
  Session 11:  2016 essay + 2016 A + 2016 B
  Session 12:  2015 essay + 2015 A + 2015 B
  Session 13:  2014 essay + 2014 A + 2014 B
  Session 14:  2013 essay + 2013 A + 2013 B

[Phase 3 — 옛 형식 (2002~2008, 객관식 시대)]
  ※ 풀이 카드 X, 개념 정리 노트만
  Session 15:  2008 essay + 2008 A + 2007 essay + 2007 A   (2개 연도 동시)
  Session 16:  2006 essay + 2006 A + 2005 essay + 2005 A
  Session 17:  2004 essay + 2004 A + 2003 A + 2001 A

[Phase 4 — 통합본 + 키워드 dedup]
  Session 18:  2009 combined (운영자 수동 분리 후)
  Session 19:  2010 combined (운영자 수동 분리 후)
  Session 20:  2011 combined (운영자 수동 분리 후)
  Session 21:  키워드 dedup + 개념 정리 노트 본문 생성 (전 연도 통합)
  Session 22:  검수·정정 + DB 적재 스크립트 작성·실행
```

> Phase 3·4는 객관식 풀이 카드 생성 X — 개념 추출만.

### 2.3 세션당 산출 표준 [v3.3 갱신]

각 시험지마다:

**Step 02a — unpdf 텍스트 추출 (LLM 미사용, 100% 정확)**
```bash
node scripts/seed/lib/extract-pdf-pages.mjs /home/jovyan/work/fitly/kice_pdfs/{year}-{session}.pdf > scripts/seed/data/papers/{year}-{session}/raw_text.txt
```

**Step 02b — pdftocairo 페이지 PNG (LLM 미사용)**
```bash
pdftocairo -png -r 150 /home/jovyan/work/fitly/kice_pdfs/{year}-{session}.pdf scripts/seed/data/papers/{year}-{session}/pages/page
```

**Step 03 — 문항 위치 식별 (LLM, 본문 생성 X)**
- 페이지 PNG를 Read 도구로 본문 시각 확인 (분석 보조)
- raw_text.txt에서 각 문항 시작·끝 character offset 식별
- **stem_text는 raw_text.txt 슬라이스로 강제** (LLM 출력 \"내용\" 부분 무시)

**Step 04 — 분석·답안·해설 (LLM, 본문 생성 X)**
- domains, bloom, keywords (3~5개)
- answer_md (학생이 시험에서 쓸 분량 — §4.5.1 표준)
- explanation_md (학습 보조 해설)
- **stem 관련 출력은 절대 사용하지 않음**

**Step 05 — JSON 작성**
```
/home/jovyan/work/.worktrees/v3-seed-pipeline/fitly/scripts/seed/data/papers/{year}-{session}/items.json
```
필수 필드: `stem_text` (unpdf 직접 슬라이스), `stem_image_paths` (PNG 경로 배열), `answer_md`, `explanation_md`, `verified_text=true`, `verified_answer=false`

**Step 06 — 자가 검증**
- [ ] `stem_text == raw_text[start:end]` (코드/수동 확인)
- [ ] §4.5.1 답안 분량 표준
- [ ] §4.5.1 해설 분량 표준

**Step 07 — commit**
```
feat(seed): SXX {year} 풀세트 시드 — {N}문항/{P}점/{T}분 (v3.3)
```

---

## 3. 세션당 권장 작업 흐름

### 3.1 1 시험지 처리 시간 (예상)

| 단계 | 시간 (Claude 채팅 기준) |
|------|------------------------|
| PDF → PNG 변환 | 30초 |
| 9~10 페이지 Read | 5~10분 (멀티모달) |
| 분석 + 모범답안 작성 | 20~40분 (논술형은 더 길게) |
| JSON Write + 검증 | 5분 |
| **1 시험지 총** | **30~60분** |
| 1 풀세트 (3 시험지) | **1.5~3시간** |

### 3.2 컨텍스트 한도 관리

- 1M context 모델, 1 세션에 PDF 9페이지 × 3 시험지 = 약 200~300K 토큰
- 모범답안 품질 향상으로 출력 토큰 증가 (이전 dry-run 대비 1.5~2배)
- **세션당 1 풀세트(3 시험지) 권장** — 그 이상은 출력 한도 분할 필요

### 3.3 세션 종료 의무

- [ ] commit 완료 (세션 SHA 기록)
- [ ] 다음 세션을 위한 다음 핸들 메모 (이 파일 §4 진행 상황 갱신)
- [ ] 풀이 카드 후보(서술형) 수 확인 — 누락 검사

---

## 4. 진행 상황 (세션마다 갱신)

| Session | 일자 | 처리 PDF | SHA | 상태 |
|---------|------|---------|-----|------|
| 01 | 2026-05-06 | 2026-essay/A/B | 68888ac | ⚠ **ARCHIVED** — v3.3 본문 정확성 정책 위배, 재시드 필요 |
| 01-redo (R0) | 2026-05-06 | 2026-essay/A/B (v3.3 절차) | 7671264 | ✅ R0 완료 — 21문항·1 issue (A#7 본문 raw_text 비순차, stem_image_paths로 시각 보장) |
| R1 | 2026-05-06 | 2025·2024·2023·2022·2021 풀세트 | 343944c·766d7de·6394f6b·8853bb8·ac571a1 | ✅ R1 완료 — 115문항/39 issues (raw_text 비순차·페이지 마커, PNG로 시각 본문 보장) |
| R2 | 2026-05-06 | 2020·2019·2018·2017·2016 풀세트 | 42f5687·40f2be3·d1cf969·81fae20·fe8ab66 | ✅ R2 완료 — 115문항/72 issues (raw_text 비순차·페이지 마커, PNG로 시각 본문 보장) |
| R3 | 2026-05-06 | 2015·2014·2013·2008·2007 풀세트 | d549734·42cb427·eacf730·7028780·ba65c9b | ✅ R3 완료 — 107문항/61 issues; **2013·2008·2007은 객관식 X (단답·서술형 혼합) 발견** (v3.2 8항 객관식 시대 시작 연도 재검토 필요); 2015는 raw_text 빈약 (이미지 PDF, PNG로 보장) |
| R4 | 2026-05-06 | 2006·2005·2004·2003·2001 풀세트 | 890e910·6d223a7(2005+2004 race)·5060b85·796d48c | ✅ R4 완료 — 85문항/78 issues; **객관식 X 종합 (R3·R4 모든 PDF 단답·서술형)** v3.2 8항 정의 재검토 필요; 2001 폰트 손상·verified_text=false; 2005·2004 폰트 ghostscript fallback |
| Phase 4 | 2026-05-06 | combined (2009/2010/2011) + dedup + DB 적재 | — | 🔄 진행 중 (3 단계: combined → dedup·concept note → DB 적재) |

> 각 세션 운영자(또는 Claude)는 본 표 1행을 추가하며 종료.

---

## 5. 답안·해설 품질 — 핵심 요지 (§4.5.1 v3.3 요약)

### 길이 (답안 vs 해설 분리)

| format | `answer_md` (시험 분량) | `explanation_md` (학습 보조) |
|--------|------------------------|----------------------------|
| 단답형 | 10~80자/소문제 | 200~400자 |
| 서술형 | **80~250자/소문제** (2~4문장) | 300~600자 |
| 논술형 | **1,500~2,400자/문항** (2매 분량) | 100~300자 |

> 답안은 학생이 70분 안에 실제 쓸 분량. 해설은 자가 채점 후 펼쳐 보는 학습 보조.

### 구성 5단 (서술/논술형)

1. 표제 (소문제 번호 + 소제목)
2. 정의·요지 (1~2문장)
3. 근거 단계 (본문 시나리오 인용·해석)
4. 확장 (교육학 이론·관련 개념 연결)
5. 결론 (교육적 의미·후속 행동)

### 문체

- 학술 한국어 ("~한다", "~이다")
- 교육학 전문 용어 적극 사용
- 본문 인용 시 큰따옴표 또는 *기울임*

### 자가 검증 (저장 전 1회 필수)

- [ ] 길이가 표준 안인가?
- [ ] 소문제 표제 명확한가?
- [ ] 본문 시나리오 근거 인용 1회 이상?
- [ ] 학술 문체 일관?
- [ ] 결론이 교육적 의미로 마무리?
- [ ] 외부 사설 해설 직접 인용 없음?

---

## 6. 객관식 시대 (2002~2013) 처리 (Phase 3, v3.2)

### 6.1 풀이 카드 생성하지 않음

객관식 문항은 `cards.type='quiz'`로 적재하지 아니한다 (헌법 v3.2 제13조의2 8항).

### 6.2 개념 정리 노트 생성

각 객관식 문항을 분석하여:

1. **핵심 개념 1~3개 추출** (정답·보기를 분석)
2. **개념 정리 노트 본문 생성** (KeywordCard 본문 구조):
   - 정의·요지
   - 핵심 요소
   - 관련 출제 이력 (이 문항 좌표 추가, "정의 묻기"/"적용 묻기"/"분석 묻기" 분류)
   - 함께 보는 키워드 (의미 인접 2~5개)
3. 출력: `concept_notes.json` (paper별 또는 통합)

### 6.3 객관식 처리 산출 형식

```json
{
  "paper": { "year": 2010, "session": "combined", ... },
  "items": [
    {
      "item_no": 12,
      "stem_md": "...",
      "format": "객관식",
      "choices": ["①...", "②...", "③...", "④...", "⑤..."],
      "answer_idx": 3,
      "domains": ["교육학"],
      "bloom": "이해",
      "concept_keywords": ["2009 개정 교육과정", "교육과정 일관성"],
      "skip_quiz_card": true,
      "verified": false
    }
  ]
}
```

`skip_quiz_card: true` 플래그가 D-S8 cards 파생 단계에서 풀이 카드 생성을 차단한다.

### 6.4 통합본 (2009/2010/2011)

운영자가 수동으로 essay/A/B로 페이지 분리 후 작업 (헌법 v3.0 Appendix A #7).
미분리 시 `combined` 시험지로 단일 적재 + skip_quiz_card.

---

## 7. 운영자 체크리스트 (사용자 = 주인님)

각 세션 시작 전 확인:

- [ ] worktree 위치 확인: `/home/jovyan/work/.worktrees/v3-seed-pipeline/`
- [ ] poppler 설치 확인: `which pdftoppm` (없으면 `mamba install -y -c conda-forge poppler`)
- [ ] 작업할 PDF 확인: `ls /home/jovyan/work/fitly/kice_pdfs/{year}-*.pdf`
- [ ] 본 핸드오프 파일을 새 세션 Claude에게 read하게 함

각 세션 종료 후:

- [ ] commit + worktree push 시점 결정 (사용자 명시 승인 시에만)
- [ ] §4 진행 상황 표 1행 추가
- [ ] 다음 세션이 이어갈 때 동일 worktree branch 사용

---

## 8. 단일 세션 시작 명령 (수동 운영용 — deprecated)

수동으로 한 세션씩 처리할 경우의 명령. **v3.3 이후 자동화는 §10 오케스트레이터 명령** 사용.

```
fitly/CLAUDE.md (헌법 v3.3)와
fitly/docs/plans/2026-05-06-seed-execution-handoff.md (세션 핸드오프 가이드)를
읽고, Session 02 (2025 풀세트) 시드 작업을 v3.3 절차로 진행해.

처리 대상:
- /home/jovyan/work/fitly/kice_pdfs/2025-essay.pdf
- /home/jovyan/work/fitly/kice_pdfs/2025-A.pdf
- /home/jovyan/work/fitly/kice_pdfs/2025-B.pdf

절차:
- Step 02a (unpdf) + Step 02b (pdftocairo) — 본문은 PDF 원본
- Step 03 (LLM 위치 식별) + Step 04 (분석·답안·해설)
- stem_text 는 raw_text 슬라이스로 강제, LLM 출력 stem 무시

품질: §4.5.1 답안 80~250자/소문제, 해설 300~600자 (서술형 기준).
끝나면 commit + 진행 상황 표 갱신.
```

---

## 9. Fallback 정책 — subagent 의문 발생 시 [v3.3 강화]

subagent는 사용자에게 직접 질문할 수 없으므로 모든 의문은 다음 정책으로 처리:

| 상황 | 대응 |
|------|------|
| 모델 출력 한도 도달 | 부분 commit (작성한 만큼) + 다음 세션이 이어받음 |
| PDF 분석 오류 (표·도식 모호) | items.json에 `extraction_issues: [...]` 메모 + verified_answer=false 유지 |
| 점수 합계 불일치 | 메타 `total_points`는 표지 신뢰, 개별 `points`는 추정값으로 명시 |
| 컨텍스트 한도 위협 | 다음 시험지를 다음 라운드로 미룸 |
| stem_text 추출 실패 (offset 식별 어려움) | 페이지 PNG를 stem_image_paths 에 그대로 보존 + stem_text 는 빈 문자열 + extraction_issues 명시 |
| 답안 분량 §4.5.1 위반 | 재작성 1회, 3회 시도 후에도 실패 시 그대로 시드 + verified_answer=false |
| 해설 분량 위반 | 동일 |
| 영역·Bloom 분류 모호 | 가장 보수적 default (예: \"교육학\" / \"적용\") + extraction_issues |
| **권한 prompt 발생** | bypass 모드면 자동 승인 / bypass 미사용이면 fallback 불가 — 오케스트레이터 채팅을 bypass 모드로 시작해야 함 |

> **원칙: subagent 는 절대 멈추지 않는다.** 모든 의문은 메모로 보존하고 다음 단계로 진행. 운영자는 검수 단계에서 정정.

---

## 10. 오케스트레이터 채팅 시작 명령 [v3.3 자동화]

**필수 사전 조건**: 새 채팅을 **bypass permissions 모드**로 시작 (도구 호출당 권한 prompt 자동 승인).

새 채팅(opus 4.7 1M, bypass 모드)에 다음 명령:

```
fitly/CLAUDE.md (헌법 v3.3),
fitly/docs/plans/2026-05-06-seed-execution-handoff.md,
fitly/docs/plans/2026-05-06-seed-pipeline-implementation.md §4,
fitly/docs/plans/2026-05-06-seed-subagent-prompt.md
를 읽고 풀스코프 시드 작업의 오케스트레이터 역할로 진입해.

작업 흐름
1. Round 0: 2026 풀세트 재시드 (subagent 1개로 검증)
   - subagent prompt 표준 §3 의 Round 0 변형 적용
   - 결과 자가 검증 통과 후 Round 1 진입
2. Round 1: 5 subagent 병렬 호출 (2025·2024·2023·2022·2021 풀세트)
3. Round 2: 5 subagent (2020·2019·2018·2017·2016)
4. Round 3: 5 subagent (2015·2014·2013·2008·2007 — Phase 3 일부)
5. Round 4: 5 subagent (2006·2005·2004·2003·2001 — Phase 3 잔여)
6. Phase 4 — combined PDF 처리 + dedup + DB 적재 (별도 단계)

각 subagent 호출:
- subagent prompt 표준 (`docs/plans/2026-05-06-seed-subagent-prompt.md` §1) 그대로 사용
- ${YEAR} 변수만 치환
- model: "opus", subagent_type: "general-purpose"

라운드 간 처리:
- 5 subagent 모두 종료될 때까지 대기 (Promise.all 패턴, run_in_background 활용)
- 각 라운드 종료 시 진행 상황 표 (§4) 갱신 commit
- extraction_issues 가 있는 풀세트는 보고에 명시 (운영자 검수 큐)

운영자 보고:
- 각 라운드 종료 시 1줄 요약 (라운드 번호 + 처리 풀세트 + 의문점 수)
- Phase 4 종료 후 종합 보고

bypass 모드 의무: subagent 도구 호출이 권한 prompt에 막히지 않도록.
fallback 정책 (§9) 적용: subagent 가 멈추지 않도록.
```

---

*본 가이드는 헌법 v3.3 시점의 풀스코프 시드 운영 표준이며, 풀스코프 시드 완료 시 폐기 또는 매년 갱신 가이드로 축약된다.*
