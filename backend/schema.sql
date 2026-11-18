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

-- Rules and a precise start time for new sessions. Existing games use v7.
CREATE TABLE IF NOT EXISTS game_rules (
  game_id TEXT PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  started_at_ms INTEGER NOT NULL
);

-- Keep the old reservations as a migration source. Daily and Freeplay now
-- have separate reservations, and only unfinished Freeplay rounds occupy a slot.
CREATE TABLE IF NOT EXISTS ranked_matches (
  game_id TEXT PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_day TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('daily','free')),
  duration_ms INTEGER,
  awarded_points INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ranked_daily_slot
  ON ranked_matches(user_id,challenge_day,difficulty) WHERE mode='daily';
CREATE UNIQUE INDEX IF NOT EXISTS ix_ranked_free_slot
  ON ranked_matches(user_id,challenge_day,difficulty) WHERE mode='free' AND duration_ms IS NULL;
CREATE INDEX IF NOT EXISTS ix_ranked_matches_user ON ranked_matches(user_id,challenge_day);
-- Cover reservations made by the previous Worker during the rollout.
CREATE TRIGGER IF NOT EXISTS migrate_ranked_reservation AFTER INSERT ON ranked_reservations
BEGIN
  INSERT OR IGNORE INTO ranked_matches(game_id,user_id,challenge_day,difficulty,mode)
  VALUES (NEW.game_id,NEW.user_id,NEW.challenge_day,NEW.difficulty,NEW.mode);
END;
INSERT OR IGNORE INTO ranked_matches(game_id,user_id,challenge_day,difficulty,mode,duration_ms,awarded_points)
SELECT r.game_id,r.user_id,r.challenge_day,r.difficulty,r.mode,
  COALESCE(b.duration_ms,CASE WHEN g.saved_user_id IS NOT NULL THEN (g.finished_at-g.created_at)*1000 END),
  CASE WHEN g.saved_user_id IS NOT NULL THEN g.score END
FROM ranked_reservations r JOIN game_sessions g ON g.id=r.game_id
LEFT JOIN game_results b ON b.game_id=r.game_id;

-- One game_results row per date and difficulty represents the player's best
-- result. Better results add only the difference to each leaderboard.
CREATE TRIGGER IF NOT EXISTS results_best_rollup AFTER UPDATE OF score ON game_results
WHEN NEW.score>OLD.score
BEGIN
  UPDATE player_stats SET points=points+NEW.score-OLD.score,wins=wins+NEW.won-OLD.won
  WHERE user_id=NEW.user_id AND difficulty=NEW.difficulty AND (
    (period_type='week' AND period_key=NEW.week_key) OR
    (period_type='month' AND period_key=NEW.month_key) OR
    (period_type='total' AND period_key='all')
  );
END;

CREATE INDEX IF NOT EXISTS ix_legacy_daily_target
  ON ranked_reservations(challenge_day,difficulty) WHERE mode='daily';
