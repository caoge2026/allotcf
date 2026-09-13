"""Rehearse additive notes migration using synthetic data on an isolated MySQL 5.7.27.

This script refuses every host/port/database except the dedicated local tunnel.
It never reads deployment credentials or production business data.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess

import pymysql
import migrate_database as migration

ROOT = Path(__file__).resolve().parents[1]


def connect(database):
    assert database in {'allotcf_rehearsal', 'allotcf_restore'}
    conn = pymysql.connect(host='127.0.0.1', port=13377, user='root',
                           password=os.environ['ALLOTCF_TEST_MYSQL_PASSWORD'],
                           database=database, charset='utf8mb4', autocommit=True)
    with conn.cursor() as cursor:
        cursor.execute('SELECT VERSION(),@@datadir')
        assert cursor.fetchone() == ('5.7.27', '/var/tmp/allotcf-rehearsal-20260913/data/')
    return conn


def install_baseline(conn):
    with conn.cursor() as cursor:
        cursor.execute('SHOW TABLES')
        assert not cursor.fetchall(), 'Rehearsal only starts with an empty database'
        sql = (ROOT / 'backend/src/main/resources/db/migration/V1__production_baseline.sql').read_text()
        for statement in sql.split(';'):
            if statement.strip():
                cursor.execute(statement)


def snapshot(conn, columns):
    with conn.cursor() as cursor:
        result = {}
        for table, names in columns.items():
            cursor.execute('SELECT ' + ','.join('`'+n+'`' for n in names) + ' FROM `'+table+'` ORDER BY id')
            result[table] = cursor.fetchall()
        return result


def main():
    source = connect('allotcf_rehearsal')
    restore = connect('allotcf_restore')
    install_baseline(source)
    expected = json.loads((ROOT/'docs/database-baseline-v1.json').read_text())
    assert not migration.differences(migration.schema_signature(source), expected)
    with source.cursor() as c:
        fixtures = [
            "INSERT INTO users(id,email,password,user_type,guest_action_count,guest_action_limit,guest_expires_at) VALUES (1,'registered@example.test','synthetic-only','REGISTERED',0,10,NULL),(2,'guest@example.test','synthetic-only','GUEST',3,10,'2030-01-01')",
            "INSERT INTO exam_set(id,title,type) VALUES(1,'Synthetic set','READING')",
            "INSERT INTO canonical_question(id,type,correct_answer) VALUES(1,'READING','A')",
            "INSERT INTO question(id,exam_set_id,canonical_question_id,sequence_order,passage) VALUES(1,1,1,1,'J’ai étudié; ceci est un test.')",
            "INSERT INTO practice_session(id,user_id,exam_set_id,total_count,correct_count) VALUES(1,2,1,1,0)",
            "INSERT INTO answer_record(id,practice_session_id,question_id,user_answer,is_correct) VALUES(1,1,1,'B',0)",
            "INSERT INTO user_exam_set_progress(id,user_id,exam_set_id,status,latest_session_id,current_index,answers_json,paused_remaining_seconds) VALUES(1,2,1,'IN_PROGRESS',1,0,'{\"1\":\"B\"}',123)",
            "INSERT INTO user_question_bookmark(id,user_id,canonical_question_id) VALUES(1,2,1)",
            "INSERT INTO user_wrong_question(id,user_id,canonical_question_id,wrong_count,last_wrong_at,review_stage,next_review_at) VALUES(1,2,1,3,'2026-01-01',2,'2026-01-03')",
            "INSERT INTO speaking_scenarios(id,title,category,image_url,prompt) VALUES(1,'Synthetic','Test','https://example.test/image','Describe')",
            "INSERT INTO speaking_attempts(id,user_id,scenario_id,user_answer,feedback_json,score) VALUES(1,2,1,'Bonjour','{}',5)",
            "INSERT INTO ai_api_keys(id,provider,api_key) VALUES(1,'test','synthetic-disabled-key')",
            "UPDATE ai_api_keys SET enabled=0",
        ]
        for sql in fixtures:
            c.execute(sql)
    columns = {t: [col[0] for col in desc['columns']] for t,desc in expected.items()}
    before = snapshot(source, columns)
    # Restore a synthetic backup into a second empty schema and compare every value.
    install_baseline(restore)
    with restore.cursor() as c:
        c.execute('SET FOREIGN_KEY_CHECKS=0')
        for table, rows in before.items():
            names = columns[table]
            sql = 'INSERT INTO `'+table+'` ('+','.join('`'+n+'`' for n in names)+') VALUES ('+','.join(['%s']*len(names))+')'
            c.executemany(sql, rows)
        c.execute('SET FOREIGN_KEY_CHECKS=1')
    assert snapshot(restore, columns) == before
    env = dict(os.environ, ALLOTCF_DB_URL='jdbc:mysql://127.0.0.1:13377/allotcf_rehearsal?useSSL=false',
               ALLOTCF_DB_USER='root', ALLOTCF_DB_PASSWORD=os.environ['ALLOTCF_TEST_MYSQL_PASSWORD'])
    entry = [os.environ.get('PYTHON', 'python3'), str(ROOT/'scripts/migrate_database.py')]
    # Prove the baseline refuses drift before touching migration history.
    with source.cursor() as c:
        c.execute('ALTER TABLE users ADD COLUMN unexpected_drift INT')
    drift = subprocess.run(entry+['check-baseline'], env=env, capture_output=True, text=True)
    assert drift.returncode != 0 and 'users' in drift.stderr
    with source.cursor() as c:
        c.execute('ALTER TABLE users DROP COLUMN unexpected_drift')
    for action in ['baseline','migrate','validate','migrate']:
        subprocess.run(entry+[action], env=env, check=True)
    assert snapshot(source, columns) == before, 'Existing business fields changed'
    with source.cursor() as c:
        c.execute("SELECT COUNT(*) FROM users WHERE role='LEARNER'")
        assert c.fetchone()[0] == 2
        c.execute('SELECT COUNT(*) FROM grammar_topic')
        assert c.fetchone()[0] == 7
        c.execute('SELECT version,success FROM flyway_schema_history ORDER BY installed_rank')
        history = c.fetchall()
        assert history == (('1',1),('2',1))
    report = dict(mysql='5.7.27', data='synthetic only; no production rows',
                  preserved_tables=len(before), preserved_rows=sum(map(len,before.values())),
                  restore_exact=True, drift_refused=True, repeated_migrate_safe=True,
                  migration_history=history,
                  preserved_values_sha256=hashlib.sha256(repr(before).encode()).hexdigest())
    (ROOT/'docs/notes-migration-rehearsal.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
    source.close()
    restore.close()


if __name__ == '__main__':
    main()
