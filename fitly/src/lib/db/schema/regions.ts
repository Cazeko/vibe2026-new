import { pgTable, varchar } from "drizzle-orm/pg-core";

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨.
//
// 본 테이블은 prod DB에 존재(drizzle/0000_exotic_boomerang.sql)하지만 현재
// query·insert 어디에도 사용되지 아니한다. 17개 라벨의 단일 source of truth는
// `src/types/index.ts`의 REGION_NAMES TS const이며, settings 입력·검증·
// userProfiles.targetUniversity 저장값·cut_scores.region 시드값이 모두 동일
// 한국어 라벨로 정합한다.
//
// 본 schema 정의는 drizzle-kit migrations 정합성 유지 목적으로만 보존된다.
// drizzle generate 시 본 export를 제거하면 DROP TABLE 마이그레이션이 생성되어
// prod DB에 영향을 줄 수 있으므로, 본 테이블의 *물리적 제거*는 별도의 명시
// 마이그레이션 + 사용자 승인을 필요로 한다 (헌법 제43조 정합).
//
// 공개된 1차 합격선은 cut_scores 테이블로 별도 관리한다 (헌법 제3조의2 4항 정합 —
// 추정값/비공개 데이터는 금지, 시도교육청 발표 1차 합격선은 사실로 표시 가능).
// 2차 합격선은 의도적으로 보유하지 아니한다 (1차만 — 주인님 지시).
export const regions = pgTable("regions", {
  code: varchar("code", { length: 4 }).primaryKey(), // 'SEL', 'GGI', 'INC', ...
  name: varchar("name", { length: 16 }).notNull(), // '서울', '경기', '인천', ...
});

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
