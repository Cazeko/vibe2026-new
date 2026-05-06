import { pgTable, varchar } from "drizzle-orm/pg-core";

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨.
// 사용자가 응시 예정 교육청을 선택 입력할 수 있다 (선택 사항).
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
