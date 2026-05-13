ALTER TABLE user_wrong_question
  ADD COLUMN review_stage INT NOT NULL DEFAULT 0,
  ADD COLUMN next_review_at DATETIME NULL,
  ADD COLUMN last_reviewed_at DATETIME NULL,
  ADD COLUMN last_review_result VARCHAR(16) NULL;

UPDATE user_wrong_question
SET next_review_at = DATE_ADD(DATE(last_wrong_at), INTERVAL 1 DAY)
WHERE next_review_at IS NULL;

CREATE INDEX idx_user_wrong_question_review_due
  ON user_wrong_question (user_id, next_review_at);
