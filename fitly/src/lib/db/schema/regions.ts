import { pgTable, varchar } from "drizzle-orm/pg-core";

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨.
// 사용자가 응시 예정 교육청을 선택 입력할 수 있다 (선택 사항).
// 합격 컷·평균 등 외부 비공개 데이터는 일체 보유하지 아니한다 (제3조의2 정합).
export const regions = pgTable("regions", {
  code: varchar("code", { length: 4 }).primaryKey(), // 'SEL', 'GGI', 'INC', ...
  name: varchar("name", { length: 16 }).notNull(), // '서울', '경기', '인천', ...
});

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
