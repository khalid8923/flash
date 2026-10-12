-- 049 - Coach Feedback (rate AI responses)
CREATE TABLE coach_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  helpful BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_coach_feedback_user ON coach_feedback (user_id, created_at DESC);