---
title: 작업별 스킬 우선 호출 매핑
constitution_articles: 제25조, 제26조
hierarchy_layer: rules
parent: ../CONSTITUTION.md
---

# 시행규칙 31 — 스킬 활용 매핑

> 본 시행규칙은 헌법 v3.3 제7장 (제25·26조)의 본문이다.

## 제25조 (작업별 우선 호출 스킬)

다음 작업이 발생할 시 명시된 스킬을 우선 활용한다 (`fitly/.claude/skills/`).

| 작업 분류 | 우선 스킬 |
|---|---|
| 사이드바 페이지·데시보드 위젯 작성 / React 패턴 검토 | `senior-frontend`, `react-best-practices`, `ui-design-system` |
| 화면 와이어프레임 / 디자인 / UX 설계 | `ui-ux-pro-max`, `frontend-design`, `canvas-design` |
| 디자인 토큰 / 색상 시스템 / 다크 라이트 모드 토글 | `ui-design-system`, `senior-frontend` |
| 차트·그래프(Recharts) 시각화 작성 | `senior-frontend`, `ui-design-system` |
| Supabase + RAG + API Routes 설계 | `senior-backend`, `senior-fullstack` |
| 기출 PDF 파싱 파이프라인 / OCR 처리 / 시드 적재 | **`pdf-processing-pro`**, `senior-backend` |
| 팟캐스트 (Gemini multi-speaker TTS) 통합 | `senior-prompt-engineer`, `senior-backend` |
| Claude API 프롬프트 설계 / 튜닝 | `senior-prompt-engineer` |
| Progress 공식 / 알고리즘 / 아키텍처 검토 | `code-reviewer`, `senior-architect` |
| 일반 코드 리뷰 · 리팩터링 · 다듬기 | `code-reviewer`, `senior-architect` |
| 외부 데모 노출 (Cloudflare Tunnel · 터널 보안) | `senior-security`, `progressive-web-app` |
| 발표용 docx 출력 / 보고서 변환 | `docx` |
| `kice_pdfs/` 정규화 / 파일 정리 | `file-organizer` |
| 커밋 메시지 작성 | `git-commit-helper` |
| 보안 점검 (Auth, 토큰, RLS) | `senior-security` |
| MCP 서버 작성 (필요 시) | `mcp-builder` |
| 신규 기능 아이디어 발산 | `brainstorming` |
| 외부 노출용 카피 / SEO | `seo-optimizer` |
| E2E·통합 테스트 | `webapp-testing` |
| PWA 셋업 / 서비스워커 / 매니페스트 / 오프라인 캐싱 | `progressive-web-app` |
| 새 스킬 직접 제작 | `skill-creator` |

## 제26조 (스킬 호출의 원칙)

1. 스킬은 *작업 분류와 일치할 때*에만 호출한다. 무작위 호출을 금한다.
2. 스킬 호출 결과가 본 헌법과 충돌하면 **본 헌법이 우선**한다.
