import {
  pgTable,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 임용 1차 합격선 — 공개된 사실 데이터 (시도교육청 발표).
// 헌법 제3조의2 4항은 *추정값/비공개 데이터*를 금지하며, 공개된 1차 합격선은 표시 가능.
// 2차 합격선은 본 테이블에서 의도적으로 보유하지 아니한다 (주인님 명시 — 1차만).
//
// verified: 운영자(주인님) 검수 후 true. OCR 자동 추출은 false 시작 — UI에 "검수 대기" 표시.
export const cutScores = pgTable(
  "cut_scores",
  {
    region: varchar("region", { length: 16 }).notNull(), // '서울'·'경기' (regions.name과 동일)
    year: integer("year").notNull(),
    appliedCount: integer("applied_count"),    // 모집인원
    applicantCount: integer("applicant_count"), // 지원인원
    competitionRatio: numeric("competition_ratio", { precision: 6, scale: 3 }), // 경쟁률
    firstRoundCutScore: numeric("first_round_cut_score", { precision: 6, scale: 2 }), // 1차 합격선
    verified: boolean("verified").notNull().default(false),
    sourceNote: varchar("source_note", { length: 64 }), // 출처 (예: "시도교육청 발표 표")
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    regionYearUq: uniqueIndex("cut_scores_region_year_uq").on(t.region, t.year),
  }),
);

export type CutScore = typeof cutScores.$inferSelect;
export type NewCutScore = typeof cutScores.$inferInsert;
