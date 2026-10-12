-- 044 - User Favorites (bookmarked games)
CREATE TABLE user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);
CREATE INDEX idx_user_favorites_user ON user_favorites (user_id, created_at DESC);