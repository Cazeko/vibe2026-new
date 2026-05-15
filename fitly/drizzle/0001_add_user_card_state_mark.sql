-- 백승환 #9 (2026-05-15) — user_card_state.mark 컬럼 + 인덱스 신설.
-- 카드별 빠른 표식(북마크 / 별표 / 모르겠음). enum 은 application layer
-- (CARD_MARK_KINDS) 에서 강제. 빈 값(NULL) 은 미마킹.

ALTER TABLE "user_card_state" ADD COLUMN IF NOT EXISTS "mark" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_card_state_user_mark_idx" ON "user_card_state" USING btree ("user_id","mark");
