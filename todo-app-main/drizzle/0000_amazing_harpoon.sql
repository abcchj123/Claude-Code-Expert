CREATE TABLE IF NOT EXISTS "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'BACKLOG' NOT NULL,
	"priority" varchar(10) DEFAULT 'MEDIUM' NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	"planned_start_date" date,
	"due_date" date,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp DEFAULT NOW() NOT NULL
);
