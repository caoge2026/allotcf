CREATE TABLE IF NOT EXISTS ai_api_keys (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(40) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  model VARCHAR(80) NOT NULL DEFAULT 'gpt-5.2',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speaking_scenarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  image_url VARCHAR(600) NOT NULL,
  prompt VARCHAR(500) NOT NULL,
  standard_answer TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speaking_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  scenario_id BIGINT NOT NULL,
  user_answer TEXT NOT NULL,
  feedback_json TEXT NOT NULL,
  score INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_speaking_attempt_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_speaking_attempt_scenario FOREIGN KEY (scenario_id) REFERENCES speaking_scenarios(id)
);

INSERT INTO speaking_scenarios (title, category, image_url, prompt)
SELECT '机场 Check-in', '旅行', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80', '你在机场办理 check-in。请描述你看到的场景，并说出旅客可能正在做什么。'
WHERE NOT EXISTS (SELECT 1 FROM speaking_scenarios WHERE title = '机场 Check-in');

INSERT INTO speaking_scenarios (title, category, image_url, prompt)
SELECT '酒店入住', '旅行', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', '你在酒店前台办理入住。请描述场景，并说明你会如何向前台提出需求。'
WHERE NOT EXISTS (SELECT 1 FROM speaking_scenarios WHERE title = '酒店入住');

INSERT INTO speaking_scenarios (title, category, image_url, prompt)
SELECT '街头问路', '日常', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', '你在城市街头向路人问路。请描述场景，并说出你会怎样礼貌地询问方向。'
WHERE NOT EXISTS (SELECT 1 FROM speaking_scenarios WHERE title = '街头问路');

-- 管理员录入 OpenAI API Key 示例：
-- INSERT INTO ai_api_keys (provider, api_key, model, enabled)
-- VALUES ('OPENAI', 'sk-你的-key', 'gpt-5.2', TRUE);
