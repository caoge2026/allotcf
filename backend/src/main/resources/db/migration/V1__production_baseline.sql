-- Production structure captured on 2026-09-13, no business rows.

CREATE TABLE `ai_api_keys` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `provider` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gpt-5.2',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `answer_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `practice_session_id` bigint(20) NOT NULL,
  `question_id` bigint(20) NOT NULL,
  `user_answer` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `time_spent_seconds` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `canonical_question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dedupe_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_a` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_b` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_c` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_d` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correct_answer` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `difficulty_level` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exam_set` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audio_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practice_session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `exam_set_id` bigint(20) NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `total_count` int(11) DEFAULT NULL,
  `correct_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exam_set_id` bigint(20) NOT NULL,
  `canonical_question_id` bigint(20) NOT NULL,
  `sequence_order` int(11) NOT NULL,
  `question_no` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passage` text COLLATE utf8mb4_unicode_ci,
  `question_text` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_a` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_b` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_c` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `option_d` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correct_answer` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `speaking_scenarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `standard_answer` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_exam_set_progress` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `exam_set_id` bigint(20) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_STARTED',
  `latest_session_id` bigint(20) DEFAULT NULL,
  `current_index` int(11) DEFAULT NULL,
  `answered_count` int(11) DEFAULT NULL,
  `total_count` int(11) DEFAULT NULL,
  `paused_remaining_seconds` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `nclc_level_label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answers_json` longtext COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_exam_set_progress_user_exam` (`user_id`,`exam_set_id`),
  KEY `idx_user_exam_set_progress_exam_set` (`exam_set_id`),
  KEY `idx_user_exam_set_progress_session` (`latest_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_question_bookmark` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `canonical_question_id` bigint(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_wrong_question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `canonical_question_id` bigint(20) NOT NULL,
  `wrong_count` int(11) NOT NULL,
  `last_wrong_at` datetime NOT NULL,
  `last_user_answer` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `review_stage` int(11) NOT NULL DEFAULT '0',
  `next_review_at` datetime DEFAULT NULL,
  `last_reviewed_at` datetime DEFAULT NULL,
  `last_review_result` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_wrong_question_review_due` (`user_id`,`next_review_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `user_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REGISTERED',
  `guest_action_count` int(11) NOT NULL DEFAULT '0',
  `guest_action_limit` int(11) NOT NULL DEFAULT '10',
  `guest_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `speaking_attempts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `scenario_id` bigint(20) NOT NULL,
  `user_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `feedback_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_speaking_attempt_user` (`user_id`),
  KEY `fk_speaking_attempt_scenario` (`scenario_id`),
  CONSTRAINT `fk_speaking_attempt_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `speaking_scenarios` (`id`),
  CONSTRAINT `fk_speaking_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
