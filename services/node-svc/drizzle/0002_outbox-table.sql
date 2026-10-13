CREATE TABLE "tasks"."outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" varchar(40) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
