CREATE TABLE IF NOT EXISTS energjob_plans (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  price            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  job_limit        INTEGER NOT NULL DEFAULT 0,
  duration         INTEGER NOT NULL DEFAULT 0,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  cms_id           INTEGER UNIQUE,
  cms_document_id  TEXT UNIQUE,
  sync_status      TEXT NOT NULL DEFAULT 'pending',
  sync_error       TEXT,
  last_synced_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energjob_plans_name_lower
  ON energjob_plans (LOWER(name));

CREATE TABLE IF NOT EXISTS energjob_recruiters (
  id                 SERIAL PRIMARY KEY,
  recruiter_name     TEXT NOT NULL,
  company_name       TEXT NOT NULL,
  company_description JSONB NOT NULL DEFAULT '[]'::jsonb,
  email              TEXT NOT NULL,
  clerk_user_id      TEXT,
  website            TEXT,
  logo               TEXT,
  address            TEXT,
  plot_no_street     TEXT,
  jobs_remaining     INTEGER NOT NULL DEFAULT 0,
  plans_expires_at   TIMESTAMPTZ,
  current_plan_id    INTEGER REFERENCES energjob_plans(id) ON DELETE SET NULL,
  cms_id             INTEGER UNIQUE,
  cms_document_id    TEXT UNIQUE,
  sync_status        TEXT NOT NULL DEFAULT 'pending',
  sync_error         TEXT,
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energjob_recruiters_email_lower
  ON energjob_recruiters (LOWER(email));

CREATE TABLE IF NOT EXISTS energjob_jobs (
  id                    SERIAL PRIMARY KEY,
  title                 TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  sector_refs           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  job_type              TEXT,
  work_mode             TEXT,
  location              TEXT,
  experience_min        INTEGER,
  experience_max        INTEGER,
  salary_min            NUMERIC(12, 2),
  salary_max            NUMERIC(12, 2),
  description           JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_responsibilities  JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills       JSONB NOT NULL DEFAULT '[]'::jsonb,
  good_to_have          JSONB NOT NULL DEFAULT '[]'::jsonb,
  qualification         TEXT,
  department            TEXT,
  role_category         TEXT,
  apply_email           TEXT,
  job_status            TEXT NOT NULL DEFAULT 'draft',
  openings              INTEGER NOT NULL DEFAULT 1,
  posted_by_recruiter_id INTEGER REFERENCES energjob_recruiters(id) ON DELETE SET NULL,
  application_count     INTEGER NOT NULL DEFAULT 0,
  cms_id                INTEGER UNIQUE,
  cms_document_id       TEXT UNIQUE,
  sync_status           TEXT NOT NULL DEFAULT 'pending',
  sync_error            TEXT,
  last_synced_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energjob_jobs_status_created
  ON energjob_jobs (job_status, created_at DESC);

CREATE TABLE IF NOT EXISTS energjob_applications (
  id                 SERIAL PRIMARY KEY,
  job_id             INTEGER NOT NULL REFERENCES energjob_jobs(id) ON DELETE CASCADE,
  applicant_name     TEXT NOT NULL,
  applicant_email    TEXT NOT NULL,
  phone              TEXT,
  resume_url         TEXT,
  cover_note         TEXT,
  early_applicant    BOOLEAN NOT NULL DEFAULT false,
  application_status TEXT NOT NULL DEFAULT 'received',
  cms_id             INTEGER UNIQUE,
  cms_document_id    TEXT UNIQUE,
  sync_status        TEXT NOT NULL DEFAULT 'pending',
  sync_error         TEXT,
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energjob_applications_job_created
  ON energjob_applications (job_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energjob_applications_job_email
  ON energjob_applications (job_id, LOWER(applicant_email));

CREATE TABLE IF NOT EXISTS energjob_payments (
  id                 SERIAL PRIMARY KEY,
  recruiter_id       INTEGER REFERENCES energjob_recruiters(id) ON DELETE SET NULL,
  plan_id            INTEGER REFERENCES energjob_plans(id) ON DELETE SET NULL,
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  amount             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status     TEXT NOT NULL DEFAULT 'created',
  expires_at         TIMESTAMPTZ,
  cms_id             INTEGER UNIQUE,
  cms_document_id    TEXT UNIQUE,
  sync_status        TEXT NOT NULL DEFAULT 'pending',
  sync_error         TEXT,
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_energjob_payments_order_id
  ON energjob_payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_energjob_payments_payment_id
  ON energjob_payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE energjob_recruiters
  ADD COLUMN IF NOT EXISTS latest_job_id INTEGER REFERENCES energjob_jobs(id) ON DELETE SET NULL;

ALTER TABLE energjob_jobs
  ADD COLUMN IF NOT EXISTS latest_application_id INTEGER REFERENCES energjob_applications(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS energjob_sync_events (
  id               SERIAL PRIMARY KEY,
  entity_type      TEXT NOT NULL,
  entity_id        INTEGER NOT NULL,
  action           TEXT NOT NULL,
  status           TEXT NOT NULL,
  request_payload  JSONB,
  response_payload JSONB,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energjob_sync_events_entity
  ON energjob_sync_events (entity_type, entity_id, created_at DESC);
