from django.db import migrations

SQL_FORWARD = """
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION game_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_updated_at ON game_match;
CREATE TRIGGER trg_match_updated_at BEFORE UPDATE ON game_match
FOR EACH ROW EXECUTE FUNCTION game_set_updated_at();

CREATE OR REPLACE FUNCTION game_move_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'move_is_immutable'; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_move_immutable ON game_move;
CREATE TRIGGER trg_move_immutable BEFORE UPDATE ON game_move
FOR EACH ROW EXECUTE FUNCTION game_move_immutable();

CREATE OR REPLACE FUNCTION game_apply_match_result() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'finished' AND OLD.status IS DISTINCT FROM 'finished' THEN
    UPDATE game_player SET matches_played = matches_played + 1
      WHERE id IN (NEW.player_one_id, NEW.player_two_id);
    IF NEW.winner_id IS NULL THEN
      UPDATE game_player SET draws = draws + 1
        WHERE id IN (NEW.player_one_id, NEW.player_two_id);
    ELSE
      UPDATE game_player SET wins = wins + 1 WHERE id = NEW.winner_id;
      UPDATE game_player SET losses = losses + 1
        WHERE id IN (NEW.player_one_id, NEW.player_two_id) AND id <> NEW.winner_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_result ON game_match;
CREATE TRIGGER trg_match_result AFTER UPDATE OF status ON game_match
FOR EACH ROW EXECUTE FUNCTION game_apply_match_result();

CREATE OR REPLACE VIEW game_leaderboard AS
SELECT id, nickname, wins, losses, draws, matches_played,
       ROUND(100.0 * wins / NULLIF(matches_played, 0), 1) AS win_rate
FROM game_player
WHERE matches_played > 0
ORDER BY wins DESC, win_rate DESC;

ALTER TABLE game_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_match  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_round  ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_move   ENABLE ROW LEVEL SECURITY;
"""

SQL_REVERSE = """
DROP VIEW IF EXISTS game_leaderboard;
DROP TRIGGER IF EXISTS trg_match_result ON game_match;
DROP FUNCTION IF EXISTS game_apply_match_result();
DROP TRIGGER IF EXISTS trg_move_immutable ON game_move;
DROP FUNCTION IF EXISTS game_move_immutable();
DROP TRIGGER IF EXISTS trg_match_updated_at ON game_match;
DROP FUNCTION IF EXISTS game_set_updated_at();
"""

def apply_postgres_sql(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(SQL_FORWARD)

def reverse_postgres_sql(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(SQL_REVERSE)

class Migration(migrations.Migration):

    dependencies = [
        ('game', '0001_initial'),
        ('players', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(apply_postgres_sql, reverse_code=reverse_postgres_sql),
    ]
