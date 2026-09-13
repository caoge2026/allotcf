"""Explicit Flyway entry point. Credentials come from ALLOTCF_DB_* environment variables."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import ssl
from urllib.parse import urlparse, parse_qs

import pymysql

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs' / 'database-baseline-v1.json'


def schema_signature(connection):
    """Compare structure rather than constraint names, which differ between imports."""
    signature = {}
    with connection.cursor() as cursor:
        cursor.execute("SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME")
        tables = cursor.fetchall()
        for table, engine, collation in tables:
            cursor.execute("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s ORDER BY ORDINAL_POSITION", (table,))
            columns = [list(row) for row in cursor.fetchall()]
            cursor.execute("SELECT NON_UNIQUE,GROUP_CONCAT(CONCAT(COLUMN_NAME,':',COALESCE(SUB_PART,0)) ORDER BY SEQ_IN_INDEX),INDEX_TYPE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s GROUP BY INDEX_NAME,NON_UNIQUE,INDEX_TYPE ORDER BY NON_UNIQUE,2", (table,))
            indexes = [list(row) for row in cursor.fetchall()]
            cursor.execute("SELECT k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.UPDATE_RULE,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON k.CONSTRAINT_SCHEMA=r.CONSTRAINT_SCHEMA AND k.CONSTRAINT_NAME=r.CONSTRAINT_NAME AND k.TABLE_NAME=r.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=%s AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.COLUMN_NAME", (table,))
            references = [[('RESTRICT' if value == 'NO ACTION' else value) for value in row] for row in cursor.fetchall()]
            signature[table] = dict(engine=engine, collation=collation, columns=columns, indexes=indexes, references=references)
    return signature


def differences(actual, expected):
    return [table for table in sorted(set(actual) | set(expected)) if actual.get(table) != expected.get(table)]


def connect():
    raw = os.environ['ALLOTCF_DB_URL']
    if not raw.startswith('jdbc:mysql://'):
        raise ValueError('ALLOTCF_DB_URL must be a jdbc:mysql URL')
    url = urlparse(raw[5:])
    if url.username or url.password or set(parse_qs(url.query)) & {'user', 'password'}:
        raise ValueError('Put credentials in ALLOTCF_DB_USER / ALLOTCF_DB_PASSWORD, not the URL')
    database = url.path.lstrip('/')
    if not database or '/' in database:
        raise ValueError('A single explicit database name is required')
    query = parse_qs(url.query)
    tls = None if query.get('useSSL') == ['false'] else ssl.create_default_context()
    return pymysql.connect(ssl=tls, host=url.hostname, port=url.port or 3306, database=database,
                           user=os.environ['ALLOTCF_DB_USER'], password=os.environ['ALLOTCF_DB_PASSWORD'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['check-baseline', 'baseline', 'info', 'validate', 'migrate'])
    args = parser.parse_args()
    # No automatic baseline, clean, repair, or destructive rollback commands.
    if args.action in {'check-baseline', 'baseline'}:
        with connect() as connection:
            changed = differences(schema_signature(connection), json.loads(MANIFEST.read_text()))
        if changed:
            raise SystemExit('Baseline refused; structural differences in: ' + ', '.join(changed))
        print('V1 schema matches: columns, defaults, indexes, foreign keys and table settings.')
        if args.action == 'check-baseline':
            return
    command = ['mvn', '-f', str(ROOT / 'backend/pom.xml')]
    if args.action == 'baseline':
        command.append('-Dflyway.baselineVersion=1')
    command.append('flyway:' + args.action)
    subprocess.run(command, check=True)


if __name__ == '__main__':
    main()
