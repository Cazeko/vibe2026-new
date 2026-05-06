---
title: 기술 스택 (불변) + 라이브러리 우선
constitution_articles: 제17조, 제19조
hierarchy_layer: laws
parent: ../CONSTITUTION.md
---

# 법률 14 — 기술 스택 + 라이브러리 우선

> 본 법률은 헌법 v3.3 제17·19조의 본문이다.

## 제17조 (불변 스택 — 사용자 승인 시에만 변경)

1. 프레임워크: **Next.js 15.x (App Router)**
2. 언어: **TypeScript (strict mode)**
3. DB: **Supabase Postgres + pgvector**
4. ORM: **Drizzle ORM**
5. 인증: **Supabase Auth** (이메일 + 카카오 OAuth)
6. 배포: **Vercel**
7. PWA: **next-pwa 또는 동등 manifest 기반 셋업**
   1. Service Worker는 **`/api/*` 응답을 캐시하지 아니한다.** 캐시 대상은 정적 자산 및 페이지 셸로 한정한다 (제28조 — 기기 공유 시 인증 응답 누설 방지).

## 제19조 (라이브러리 우선 원칙)

다음의 경우 자체 구현 대신 검증된 라이브러리를 우선한다.

- 간격 반복(SRS) → ts-fsrs
- 차트 → Recharts
- 폼 → React Hook Form + Zod
- UI 프리미티브 → Radix UI / shadcn 패턴
