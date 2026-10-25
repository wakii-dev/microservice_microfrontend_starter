CREATE SCHEMA IF NOT EXISTS "tasks";
--> statement-breakpoint
CREATE TABLE "tasks"."tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'todo' NOT NULL,
	"assignee_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "status_check" CHECK ("tasks"."tasks"."status" IN ('todo', 'in_progress', 'done'))
);
--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks"."tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_assignee_id" ON "tasks"."tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_at" ON "tasks"."tasks" USING btree ("created_at" DESC NULLS LAST);