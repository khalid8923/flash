-- 050 - Onboarding Progress
CREATE TABLE onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tour_completed BOOLEAN NOT NULL DEFAULT false,
  first_session_done BOOLEAN NOT NULL DEFAULT false,
  profile_set BOOLEAN NOT NULL DEFAULT false,
  goals_selected TEXT[],
  step_current INTEGER NOT NULL DEFAULT 0,
  dismissed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);