-- 046 - Email Subscriptions
CREATE TABLE email_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  weekly_digest BOOLEAN NOT NULL DEFAULT false,
  daily_reminder BOOLEAN NOT NULL DEFAULT false,
  streak_alerts BOOLEAN NOT NULL DEFAULT true,
  milestone_alerts BOOLEAN NOT NULL DEFAULT true,
  reminder_hour SMALLINT NOT NULL DEFAULT 20 CHECK (reminder_hour BETWEEN 0 AND 23),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  unsubscribed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);