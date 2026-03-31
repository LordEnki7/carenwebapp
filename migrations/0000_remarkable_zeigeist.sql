CREATE TABLE "attorney_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"attorney_id" integer NOT NULL,
	"incident_id" integer,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attorneys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"firm_name" varchar,
	"specialties" jsonb,
	"states" jsonb,
	"rating" integer,
	"verified" boolean DEFAULT false,
	"contact_info" jsonb,
	"bio" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"location" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"media_urls" jsonb,
	"cloud_backup" boolean DEFAULT false,
	"contacts_notified" boolean DEFAULT false,
	"report_generated" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" varchar NOT NULL,
	"category" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"details" text,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user' NOT NULL,
	"subscription_tier" varchar DEFAULT 'free' NOT NULL,
	"current_state" varchar,
	"preferred_language" varchar DEFAULT 'en',
	"emergency_contacts" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attorney_connections" ADD CONSTRAINT "attorney_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attorney_connections" ADD CONSTRAINT "attorney_connections_attorney_id_attorneys_id_fk" FOREIGN KEY ("attorney_id") REFERENCES "public"."attorneys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attorney_connections" ADD CONSTRAINT "attorney_connections_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attorneys" ADD CONSTRAINT "attorneys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");