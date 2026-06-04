ALTER TABLE energjob_applications 
  ADD COLUMN IF NOT EXISTS recruiter_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_energjob_applications_token 
  ON energjob_applications (recruiter_token) 
  WHERE recruiter_token IS NOT NULL;
