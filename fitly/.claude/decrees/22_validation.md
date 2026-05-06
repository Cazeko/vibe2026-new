---
title: 검증 의무 + 운영 기준
constitution_articles: 제24조, 제24조의3
hierarchy_layer: decrees
parent: ../CONSTITUTION.md
---

# 시행령 22 — 검증 의무

> 본 시행령은 헌법 v3.3 제24조·제24조의3의 본문이다.

## 제24조 (검증 의무)

의존성 추가·스키마 변경·빌드 설정 수정 시 **반드시 `npm run build`** 또는 동등한 검증 명령으로 결과를 확인한다.

## 제24조의3 (검증의 운영 기준)

1. 다음 변경은 **`npx tsc --noEmit`** (5~10초) 검증으로 충분하다.
   - 컴포넌트·페이지의 단순 수정
   - 스타일·문자열·타입 보강
   - 기존 모듈 내부 리팩터링

2. 다음 변경은 **`npm run build`** (수 분)를 의무로 수행한다.
   - 의존성 추가·제거·업그레이드
   - DB 스키마 변경
   - `next.config.mjs` / `tailwind.config.ts` / `tsconfig.json` / `drizzle.config.ts` 수정
   - 미들웨어 변경
   - 라우트 추가·제거 (app/ 디렉토리 구조 변경)
   - 환경 변수 흐름 변경

3. 단위 테스트가 존재하는 영역(예: `src/lib/fit/score.ts`)을 수정한 경우 **`npm test`** 를 함께 수행한다.

4. 본 조항은 제24조의 *방법적 세분화*이며, 제24조의 의무를 약화시키지 아니한다.
