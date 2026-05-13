CREATE DATABASE IF NOT EXISTS allo DEFAULT CHARSET utf8mb4;
USE allo;

CREATE TABLE exam_set (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'READING',
    audio_url   VARCHAR(500),
    created_at  DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE canonical_question (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    type           VARCHAR(20) NOT NULL DEFAULT 'READING',
    dedupe_key     VARCHAR(255) NOT NULL UNIQUE,
    option_a       VARCHAR(300) NOT NULL,
    option_b       VARCHAR(300) NOT NULL,
    option_c       VARCHAR(300) NOT NULL,
    option_d       VARCHAR(300) NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    difficulty_level VARCHAR(2) NOT NULL DEFAULT 'A1',
    created_at     DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE question (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_set_id    BIGINT NOT NULL,
    canonical_question_id BIGINT NOT NULL,
    sequence_order INT    NOT NULL,
    question_no    VARCHAR(20),
    passage        TEXT,
    question_text  VARCHAR(500) NOT NULL,
    option_a       VARCHAR(300) NOT NULL,
    option_b       VARCHAR(300) NOT NULL,
    option_c       VARCHAR(300) NOT NULL,
    option_d       VARCHAR(300) NOT NULL,
    correct_answer CHAR(1)      NOT NULL,
    FOREIGN KEY (exam_set_id) REFERENCES exam_set(id),
    FOREIGN KEY (canonical_question_id) REFERENCES canonical_question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(200) UNIQUE NOT NULL,
    password     VARCHAR(100) NOT NULL,
    nickname     VARCHAR(50),
    created_at   DATETIME DEFAULT NOW(),
    last_login   DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE practice_session (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    exam_set_id   BIGINT NOT NULL,
    started_at    DATETIME DEFAULT NOW(),
    finished_at   DATETIME,
    total_count   INT,
    correct_count INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_set_id) REFERENCES exam_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE answer_record (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    practice_session_id BIGINT NOT NULL,
    question_id         BIGINT NOT NULL,
    user_answer         CHAR(1) NOT NULL,
    is_correct          TINYINT(1) NOT NULL,
    time_spent_seconds  INT,
    FOREIGN KEY (practice_session_id) REFERENCES practice_session(id),
    FOREIGN KEY (question_id) REFERENCES question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_wrong_question (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id               BIGINT NOT NULL,
    canonical_question_id BIGINT NOT NULL,
    wrong_count           INT NOT NULL DEFAULT 0,
    last_wrong_at         DATETIME NOT NULL,
    last_user_answer      CHAR(1),
    created_at            DATETIME DEFAULT NOW(),
    updated_at            DATETIME DEFAULT NOW(),
    UNIQUE KEY uk_user_wrong_question (user_id, canonical_question_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (canonical_question_id) REFERENCES canonical_question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_question_bookmark (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id               BIGINT NOT NULL,
    canonical_question_id BIGINT NOT NULL,
    created_at            DATETIME DEFAULT NOW(),
    UNIQUE KEY uk_user_question_bookmark (user_id, canonical_question_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (canonical_question_id) REFERENCES canonical_question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
