CREATE TABLE IF NOT EXISTS "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"target_university" varchar(16),
	"exam_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" varchar(16) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"cards_reviewed" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"fit_score" numeric(5, 2),
	"accuracy" numeric(5, 2),
	"study_minutes" integer DEFAULT 0 NOT NULL,
	"cards_reviewed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_logs_user_log_date_unique" UNIQUE("user_id","log_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"code" varchar(4) PRIMARY KEY NOT NULL,
	"name" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"session" varchar(12) NOT NULL,
	"pdf_path" text NOT NULL,
	"source_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"item_no" integer NOT NULL,
	"stem_text" text NOT NULL,
	"stem_image_path" text,
	"points" integer,
	"format" varchar(16),
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bloom" varchar(8),
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer_md" text,
	"explanation_md" text,
	"verified_text" boolean DEFAULT true NOT NULL,
	"verified_answer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(16) NOT NULL,
	"source_item_id" uuid,
	"user_id" uuid,
	"front_text" text NOT NULL,
	"front_image_path" text,
	"back_md" text,
	"verified_text" boolean DEFAULT false NOT NULL,
	"verified_answer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_card_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"fsrs_state" jsonb NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_card_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"grade" varchar(8) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"answer_md" text NOT NULL,
	"self_grade" varchar(8),
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcast_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(8) NOT NULL,
	"user_id" uuid,
	"theme" text NOT NULL,
	"script_json" jsonb,
	"audio_url" text,
	"duration_sec" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcast_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"episode_id" uuid NOT NULL,
	"current_sec" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exam_items" ADD CONSTRAINT "exam_items_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cards" ADD CONSTRAINT "cards_source_item_id_exam_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."exam_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_card_state" ADD CONSTRAINT "user_card_state_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_card_log" ADD CONSTRAINT "user_card_log_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_attempts" ADD CONSTRAINT "user_attempts_item_id_exam_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."exam_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "podcast_progress" ADD CONSTRAINT "podcast_progress_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exam_papers_year_session_uq" ON "exam_papers" USING btree ("year","session");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "exam_items_paper_item_uq" ON "exam_items" USING btree ("paper_id","item_no");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exam_items_format_idx" ON "exam_items" USING btree ("format");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cards_shared_seed_uq" ON "cards" USING btree ("source_item_id","type") WHERE "cards"."user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cards_user_owned_uq" ON "cards" USING btree ("source_item_id","type","user_id") WHERE "cards"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cards_user_type_idx" ON "cards" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_card_state_user_card_uq" ON "user_card_state" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_card_state_user_due_idx" ON "user_card_state" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_card_log_user_card_time_idx" ON "user_card_log" USING btree ("user_id","card_id","reviewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_attempts_user_item_idx" ON "user_attempts" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "podcast_episodes_scope_user_idx" ON "podcast_episodes" USING btree ("scope","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "podcast_progress_user_episode_uq" ON "podcast_progress" USING btree ("user_id","episode_id");