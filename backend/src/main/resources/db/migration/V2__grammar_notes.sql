ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'LEARNER';
CREATE TABLE grammar_note (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 author_id BIGINT NOT NULL,
 slug VARCHAR(120) NOT NULL UNIQUE,
 visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
 draft_revision_id BIGINT NULL,
 published_revision_id BIGINT NULL,
 lock_version BIGINT NOT NULL DEFAULT 0,
 published_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE grammar_note_revision (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 note_id BIGINT NOT NULL,
 revision_no BIGINT NOT NULL,
 title VARCHAR(200) NOT NULL,
 summary VARCHAR(400) NOT NULL,
 body_markdown LONGTEXT NOT NULL,
 cefr_level VARCHAR(2) NOT NULL DEFAULT '',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uk_note_revision(note_id,revision_no),
 UNIQUE KEY uk_note_revision_owner(note_id,id),
 FOREIGN KEY(note_id) REFERENCES grammar_note(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Composite references prevent pointers from selecting another note's revision.
ALTER TABLE grammar_note
 ADD CONSTRAINT fk_note_draft FOREIGN KEY(id,draft_revision_id) REFERENCES grammar_note_revision(note_id,id),
 ADD CONSTRAINT fk_note_published FOREIGN KEY(id,published_revision_id) REFERENCES grammar_note_revision(note_id,id);
CREATE TABLE grammar_topic (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 slug VARCHAR(80) NOT NULL UNIQUE,
 name VARCHAR(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO grammar_topic(slug,name) VALUES
 ('tenses','时态'),('pronouns','代词'),('subjunctive','虚拟式'),('sentence','句子结构'),
 ('prepositions','介词'),('agreement','性数配合'),('other','其他');
CREATE TABLE grammar_note_revision_topic (
 revision_id BIGINT NOT NULL,
 topic_id BIGINT NOT NULL,
 PRIMARY KEY(revision_id,topic_id),
 FOREIGN KEY(revision_id) REFERENCES grammar_note_revision(id),
 FOREIGN KEY(topic_id) REFERENCES grammar_topic(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
