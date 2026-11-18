PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_sessions_exp ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  play_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('normal','hard','rush')),
  target_code TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  finished_at INTEGER,
  guesses_json TEXT NOT NULL DEFAULT '[]',
  revealed INTEGER NOT NULL,
  penalty INTEGER NOT NULL DEFAULT 0,
  hints_bought INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  saved_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_games_age ON game_sessions(created_at);
CREATE TABLE IF NOT EXISTS game_results (
  game_id TEXT PRIMARY KEY REFERENCES game_sessions(id),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_day TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  week_key TEXT NOT NULL,
  month_key TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 5000),
  won INTEGER NOT NULL CHECK(won IN (0,1)),
  guesses INTEGER NOT NULL,
  hints INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id,challenge_day,difficulty)
);
CREATE INDEX IF NOT EXISTS ix_results_user ON game_results(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS player_stats (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK(period_type IN ('week','month','total')),
  period_key TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  games INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id,period_type,period_key,difficulty)
);
CREATE INDEX IF NOT EXISTS ix_stats_leader ON player_stats(period_type,period_key,difficulty,points DESC,wins DESC);
CREATE TRIGGER IF NOT EXISTS results_rollup AFTER INSERT ON game_results
BEGIN
  INSERT INTO player_stats(user_id,period_type,period_key,difficulty,points,wins,games)
  VALUES (NEW.user_id,'week',NEW.week_key,NEW.difficulty,NEW.score,NEW.won,1)
  ON CONFLICT(user_id,period_type,period_key,difficulty) DO UPDATE SET
    points=points+excluded.points,wins=wins+excluded.wins,games=games+1;
  INSERT INTO player_stats(user_id,period_type,period_key,difficulty,points,wins,games)
  VALUES (NEW.user_id,'month',NEW.month_key,NEW.difficulty,NEW.score,NEW.won,1)
  ON CONFLICT(user_id,period_type,period_key,difficulty) DO UPDATE SET
    points=points+excluded.points,wins=wins+excluded.wins,games=games+1;
  INSERT INTO player_stats(user_id,period_type,period_key,difficulty,points,wins,games)
  VALUES (NEW.user_id,'total','all',NEW.difficulty,NEW.score,NEW.won,1)
  ON CONFLICT(user_id,period_type,period_key,difficulty) DO UPDATE SET
    points=points+excluded.points,wins=wins+excluded.wins,games=games+1;
END;

-- One verified competitive attempt per account, UTC day and difficulty,
-- irrespective of whether the map mode was daily or free play.
CREATE TABLE IF NOT EXISTS ranked_reservations (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL UNIQUE REFERENCES game_sessions(id) ON DELETE CASCADE,
  challenge_day TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('daily','free')),
  PRIMARY KEY(user_id, challenge_day, difficulty)
);
-- Remove the obsolete per-IP leaderboard cooldown (safe to repeat on staging deploy).
DROP TABLE IF EXISTS leaderboard_cooldowns;

-- Map overlays purchased for verified games. An independent table keeps
-- existing staging sessions compatible with the schema migration.
CREATE TABLE IF NOT EXISTS game_overlays (
  game_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  clue_key TEXT NOT NULL CHECK(clue_key IN ('continent','hemisphere','longitude')),
  PRIMARY KEY(game_id,clue_key)
);
