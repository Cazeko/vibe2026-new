# ARCHIVED — v3.3 본문 정확성 정책 위배

본 폴더의 `items.json`은 2026-05-06 단기 dry-run에서 LLM 멀티모달 분석으로 생성된 결과이며, 헌법 v3.3 9항 \"시험 문제 본문 100% 정확성 보장 정책\"에 위배됩니다.

## 위배 사유

`items.json`의 `stem_md` 필드가 LLM이 생성한 본문 요약·재구성으로 채워져 있습니다. v3.3은 본문을 **PDF 원본의 unpdf 텍스트 + pdftocairo PNG**로만 구성하도록 요구합니다.

## 재시드 절차

이 디렉토리를 `items-archived.json`으로 보존하고, 새 절차에 따라 재시드합니다.

```bash
# Step 02a — unpdf 텍스트
node scripts/seed/lib/extract-pdf-pages.mjs /home/jovyan/work/fitly/kice_pdfs/2026-essay.pdf > raw_text.txt

# Step 02b — 페이지 PNG
pdftocairo -png -r 150 /home/jovyan/work/fitly/kice_pdfs/2026-essay.pdf pages/page

# Step 03~04 — LLM은 분석·답안만, 본문은 unpdf 슬라이스 강제
```

상세는 `docs/plans/2026-05-06-seed-pipeline-implementation.md` §4.3~§4.5 (v3.3 갱신) 참조.

## 보존 가치

본 산출물은 \"LLM 멀티모달 분석으로 본문을 만들면 95~98% 정확성에 머무름\"의 실증 사례로 plan Appendix B에서 보존됩니다. 풀스코프 시드에는 사용하지 않습니다.
