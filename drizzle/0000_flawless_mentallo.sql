CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"user_id" text,
	"user_name" text,
	"user_role" text,
	"action_type" text,
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"details" text,
	"action" text,
	"ip_address" text,
	"timestamp" text
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"client_id" text NOT NULL,
	"title" text,
	"case_number" text,
	"year" text,
	"type" text,
	"degree" text,
	"court" text,
	"circle" text,
	"governorate" text,
	"district" text,
	"registration_date" text,
	"filing_date" text,
	"status" text,
	"claim_value" real,
	"opponents" text,
	"opponent_name" text,
	"opponent_lawyer" text,
	"assigned_lawyer_id" text,
	"description" text,
	"notes" text,
	"total_fees" real,
	"paid_fees" real,
	"timeline" jsonb,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"name" text NOT NULL,
	"national_id" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"address" text,
	"type" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"communication_logs" jsonb,
	"interaction_logs" jsonb,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "court_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"case_id" text NOT NULL,
	"court" text,
	"circle" text,
	"date" text,
	"time" text,
	"type" text,
	"assigned_lawyer_id" text,
	"notes_before" text,
	"notes" text,
	"requirements" text,
	"result" text,
	"decision" text,
	"next_session_date" text,
	"is_completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"case_id" text,
	"client_id" text,
	"title" text,
	"type" text,
	"category" text,
	"file_name" text,
	"file_size" text,
	"file_url" text,
	"file_type" text,
	"uploaded_by" text,
	"uploaded_by_id" text,
	"uploaded_at" text,
	"timestamp" text,
	"notes" text,
	"tags" jsonb,
	"versions" jsonb
);
--> statement-breakpoint
CREATE TABLE "entrance_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text,
	"user_name" text,
	"user_role" text,
	"user_email" text,
	"timestamp" text,
	"ip_address" text,
	"device_info" text,
	"location" text,
	"coordinates" jsonb,
	"is_read" boolean DEFAULT false,
	"type" text
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"case_id" text,
	"client_id" text,
	"title" text,
	"type" text,
	"category" text,
	"amount" real,
	"date" text,
	"employee_id" text,
	"paid_by" text,
	"receipt_number" text,
	"notes" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"name" text,
	"phone" text,
	"created_at" text,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"lawyer_name" text,
	"logo_text" text,
	"address" text,
	"phone" text,
	"email" text,
	"tax_number" text,
	"bar_association_number" text,
	"reminder_settings" jsonb,
	"subscription" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"case_id" text,
	"client_id" text,
	"amount" real,
	"date" text,
	"method" text,
	"payment_method" text,
	"recipient_id" text,
	"received_by" text,
	"receipt_number" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"date" text,
	"plan_name" text,
	"amount" real,
	"currency" text,
	"payment_method" text,
	"status" text,
	"receipt_url" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text NOT NULL,
	"title" text NOT NULL,
	"case_id" text,
	"client_id" text,
	"assigned_lawyer_id" text,
	"assigned_to_id" text,
	"assigned_to_name" text,
	"priority" text,
	"start_date" text,
	"due_date" text,
	"created_at" text,
	"status" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"office_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true,
	"password" text,
	"is_super_user" boolean DEFAULT false,
	"permissions" jsonb,
	"referred_by_ad" boolean,
	"utm_source" text,
	"utm_campaign" text,
	"registration_ip" text,
	"registration_device" text,
	"registration_location" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_sessions" ADD CONSTRAINT "court_sessions_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_sessions" ADD CONSTRAINT "court_sessions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_office_idx" ON "audit_logs" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "cases_office_idx" ON "cases" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "cases_client_idx" ON "cases" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "clients_office_idx" ON "clients" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "court_sessions_office_idx" ON "court_sessions" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "court_sessions_case_idx" ON "court_sessions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "documents_office_idx" ON "documents" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "expenses_office_idx" ON "expenses" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "leads_office_idx" ON "leads" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "payments_office_idx" ON "payments" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "subscription_invoices_office_idx" ON "subscription_invoices" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "tasks_office_idx" ON "tasks" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "users_office_idx" ON "users" USING btree ("office_id");