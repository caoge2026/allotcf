import argparse
import hashlib
import os
import re
import unicodedata

import pymysql
from docx import Document
from dotenv import load_dotenv

load_dotenv()


def parse_answers(line: str) -> list[str]:
    """Extract answers from a line like '答案: ACDAB BCAAB'."""
    line = line.strip()
    match = re.search(r'答案[：:]\s*(.+)', line)
    if not match:
        return []
    raw = match.group(1).replace(' ', '').upper()
    return list(raw)


def get_paragraph_type(para) -> str:
    """Classify a paragraph as heading, bold, or normal."""
    if para.style.name.startswith('Heading'):
        return 'heading'
    if para.runs and all(run.bold for run in para.runs if run.text.strip()):
        return 'bold'
    return 'normal'


def is_question_marker(text: str, ptype: str) -> bool:
    """Match either legacy heading numbers or real doc markers like 1-1."""
    stripped = text.strip()
    if ptype == 'heading' and stripped.isdigit():
        return True
    if ptype == 'bold' and re.fullmatch(r'\d+(?:-\d+)?', stripped):
        return True
    return False


def is_options_heading(text: str) -> bool:
    return text.strip().lower() == 'options:'


def extract_paragraphs(doc_path: str) -> list[tuple[str, str]]:
    """Read non-empty paragraphs from a Word document."""
    doc = Document(doc_path)
    result: list[tuple[str, str]] = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            result.append((text, get_paragraph_type(para)))
    return result


def parse_questions(paragraphs: list[tuple[str, str]]) -> list[dict]:
    """Parse question records from extracted paragraphs."""
    answers: list[str] = []
    for text, _ in paragraphs:
        if '答案' in text and (':' in text or '：' in text):
            answers = parse_answers(text)
            break

    questions = []
    i = 0
    while i < len(paragraphs):
        text, ptype = paragraphs[i]
        if is_question_marker(text, ptype):
            question = {
                'question_no': text.strip(),
                'sequence_order': len(questions) + 1,
                'question_text': '',
                'passage': '',
                'option_a': '',
                'option_b': '',
                'option_c': '',
                'option_d': '',
                'correct_answer': '',
            }

            i += 1
            if (
                i < len(paragraphs)
                and paragraphs[i][1] == 'bold'
                and not is_options_heading(paragraphs[i][0])
                and not is_question_marker(paragraphs[i][0], paragraphs[i][1])
            ):
                question['question_text'] = paragraphs[i][0]
                i += 1

            passage_lines = []
            while i < len(paragraphs):
                current_text, current_type = paragraphs[i]
                if is_options_heading(current_text) or is_question_marker(current_text, current_type):
                    break
                if current_type == 'normal' and current_text and current_text != '__________________________________________________':
                    passage_lines.append(paragraphs[i][0])
                i += 1
            question['passage'] = '\n'.join(passage_lines)

            if i < len(paragraphs) and is_options_heading(paragraphs[i][0]):
                i += 1

            option_keys = ['option_a', 'option_b', 'option_c', 'option_d']
            for key in option_keys:
                if i < len(paragraphs):
                    option_text = re.sub(r'^[ABCD][\.。]\s*', '', paragraphs[i][0])
                    question[key] = option_text
                    i += 1

            answer_index = question['sequence_order'] - 1
            if answer_index < len(answers):
                question['correct_answer'] = answers[answer_index]

            questions.append(question)
        else:
            i += 1

    return questions


def normalize_option_text(text: str) -> str:
    normalized = unicodedata.normalize('NFKC', text or '')
    normalized = re.sub(r'\s+', ' ', normalized.strip())
    return normalized


def build_dedupe_key(question: dict) -> str:
    parts = [
        normalize_option_text(question['option_a']),
        normalize_option_text(question['option_b']),
        normalize_option_text(question['option_c']),
        normalize_option_text(question['option_d']),
        normalize_option_text(question['correct_answer']).upper(),
    ]
    payload = '||'.join(parts).encode('utf-8')
    return hashlib.sha256(payload).hexdigest()


DIFFICULTY_RANK = {
    'A1': 1,
    'A2': 2,
    'B1': 3,
    'B2': 4,
    'C1': 5,
    'C2': 6,
}


def map_sequence_to_difficulty_level(sequence_order: int) -> str:
    if 1 <= sequence_order <= 4:
        return 'A1'
    if 5 <= sequence_order <= 10:
        return 'A2'
    if 11 <= sequence_order <= 19:
        return 'B1'
    if 20 <= sequence_order <= 29:
        return 'B2'
    if 30 <= sequence_order <= 35:
        return 'C1'
    return 'C2'


def max_difficulty_level(level_a: str, level_b: str) -> str:
    return level_a if DIFFICULTY_RANK[level_a] >= DIFFICULTY_RANK[level_b] else level_b


def insert_to_db(title: str, questions: list[dict]) -> tuple[int, int]:
    """Insert an exam set and its questions into MySQL."""
    conn = pymysql.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=int(os.getenv('DB_PORT', 3306)),
        db=os.getenv('DB_NAME', 'allo'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        charset='utf8mb4',
    )
    success = 0
    fail = 0

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO exam_set (title, type) VALUES (%s, 'READING')",
                (title,),
            )
            exam_set_id = cursor.lastrowid

            for question in questions:
                try:
                    dedupe_key = build_dedupe_key(question)
                    difficulty_level = map_sequence_to_difficulty_level(question['sequence_order'])
                    cursor.execute(
                        """
                        SELECT id, difficulty_level FROM canonical_question
                        WHERE dedupe_key = %s
                        """,
                        (dedupe_key,),
                    )
                    row = cursor.fetchone()
                    if row:
                        canonical_question_id = row[0]
                        existing_level = row[1]
                        next_level = max_difficulty_level(existing_level, difficulty_level)
                        if next_level != existing_level:
                            cursor.execute(
                                """
                                UPDATE canonical_question
                                SET difficulty_level = %s
                                WHERE id = %s
                                """,
                                (next_level, canonical_question_id),
                            )
                    else:
                        cursor.execute(
                            """
                            INSERT INTO canonical_question
                            (type, dedupe_key, option_a, option_b, option_c, option_d, correct_answer, difficulty_level)
                            VALUES ('READING', %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                dedupe_key,
                                question['option_a'],
                                question['option_b'],
                                question['option_c'],
                                question['option_d'],
                                question['correct_answer'],
                                difficulty_level,
                            ),
                        )
                        canonical_question_id = cursor.lastrowid

                    cursor.execute(
                        """
                        INSERT INTO question
                        (exam_set_id, canonical_question_id, sequence_order, question_no, passage,
                         question_text, option_a, option_b, option_c, option_d, correct_answer)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            exam_set_id,
                            canonical_question_id,
                            question['sequence_order'],
                            question['question_no'],
                            question['passage'],
                            question['question_text'],
                            question['option_a'],
                            question['option_b'],
                            question['option_c'],
                            question['option_d'],
                            question['correct_answer'],
                        ),
                    )
                    success += 1
                except Exception:
                    fail += 1
        conn.commit()
    finally:
        conn.close()

    return success, fail


def main():
    parser = argparse.ArgumentParser(description='导入 Word 真题到数据库')
    parser.add_argument('--file', required=True, help='Word 文档路径')
    parser.add_argument('--title', required=True, help='套题标题')
    args = parser.parse_args()

    print(f"读取文档: {args.file}")
    paragraphs = extract_paragraphs(args.file)
    questions = parse_questions(paragraphs)
    print(f"解析到 {len(questions)} 道题")

    success, fail = insert_to_db(args.title, questions)
    print(f"导入完成：成功 {success} 题，失败 {fail} 题")


if __name__ == '__main__':
    main()
