import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from import_script import (
    build_dedupe_key,
    is_question_marker,
    map_sequence_to_difficulty_level,
    max_difficulty_level,
    parse_answers,
    parse_questions,
)


def test_parse_answers_basic():
    line = "答案: ACDAB BCAAB"
    result = parse_answers(line)
    assert result == ['A', 'C', 'D', 'A', 'B', 'B', 'C', 'A', 'A', 'B']


def test_parse_answers_no_spaces():
    line = "答案:ACDAB"
    result = parse_answers(line)
    assert result == ['A', 'C', 'D', 'A', 'B']


def test_parse_questions_count():
    paragraphs = [
        ("答案: AB", "normal"),
        ("1", "heading"),
        ("题目一问句", "bold"),
        ("阅读材料正文", "normal"),
        ("Options:", "bold"),
        ("A. 选项一", "normal"),
        ("B. 选项二", "normal"),
        ("C. 选项三", "normal"),
        ("D. 选项四", "normal"),
        ("2", "heading"),
        ("题目二问句", "bold"),
        ("", "normal"),
        ("Options:", "bold"),
        ("A. 选项A", "normal"),
        ("B. 选项B", "normal"),
        ("C. 选项C", "normal"),
        ("D. 选项D", "normal"),
    ]
    questions = parse_questions(paragraphs)
    assert len(questions) == 2


def test_parse_questions_fields():
    paragraphs = [
        ("答案: AC", "normal"),
        ("1", "heading"),
        ("这是题目问句？", "bold"),
        ("这是阅读材料。", "normal"),
        ("Options:", "bold"),
        ("A. 第一选项", "normal"),
        ("B. 第二选项", "normal"),
        ("C. 第三选项", "normal"),
        ("D. 第四选项", "normal"),
    ]
    questions = parse_questions(paragraphs)
    q = questions[0]
    assert q['question_text'] == "这是题目问句？"
    assert q['passage'] == "这是阅读材料。"
    assert q['option_a'] == "第一选项"
    assert q['option_b'] == "第二选项"
    assert q['correct_answer'] == 'A'
    assert q['sequence_order'] == 1


def test_is_question_marker_supports_real_doc_format():
    assert is_question_marker("1-1", "bold") is True
    assert is_question_marker("10-39", "bold") is True
    assert is_question_marker("1", "heading") is True
    assert is_question_marker("Options:", "bold") is False


def test_parse_questions_real_doc_style():
    paragraphs = [
        ("答案：BA", "normal"),
        ("1-1", "bold"),
        ("Qu'est-ce que Patrick fait chez Louise ?", "bold"),
        ("Maman. Je fais mes devoirs de mathématiques chez Louise.", "normal"),
        ("Options:", "bold"),
        ("A. Il dort.", "normal"),
        ("B. Il travaille.", "normal"),
        ("C. Il joue.", "normal"),
        ("D. Il mange.", "normal"),
        ("__________________________________________________", "normal"),
        ("1-2", "bold"),
        ("À quoi sert cette affiche ?", "bold"),
        ("Attention Cette semaine, l’accueil de l’université est fermé.", "normal"),
        ("Options:", "bold"),
        ("A. Annoncer un changement.", "normal"),
        ("B. Décrire un endroit.", "normal"),
        ("C. Donner un rendez-vous.", "normal"),
        ("D. Organiser une réunion.", "normal"),
    ]

    questions = parse_questions(paragraphs)

    assert len(questions) == 2
    assert questions[0]['question_no'] == "1-1"
    assert questions[0]['question_text'] == "Qu'est-ce que Patrick fait chez Louise ?"
    assert questions[0]['option_b'] == "Il travaille."
    assert questions[0]['correct_answer'] == 'B'
    assert questions[1]['question_no'] == "1-2"
    assert questions[1]['correct_answer'] == 'A'


def test_build_dedupe_key_ignores_question_text_when_options_match():
    question_a = {
        'option_a': 'A. même option',
        'option_b': 'B. autre option',
        'option_c': 'C. troisième',
        'option_d': 'D. quatrième',
        'correct_answer': 'B',
    }
    question_b = {
        'option_a': 'A. même option',
        'option_b': 'B. autre option',
        'option_c': 'C. troisième',
        'option_d': 'D. quatrième',
        'correct_answer': 'B',
    }

    assert build_dedupe_key(question_a) == build_dedupe_key(question_b)


def test_map_sequence_to_difficulty_level():
    assert map_sequence_to_difficulty_level(1) == 'A1'
    assert map_sequence_to_difficulty_level(5) == 'A2'
    assert map_sequence_to_difficulty_level(11) == 'B1'
    assert map_sequence_to_difficulty_level(20) == 'B2'
    assert map_sequence_to_difficulty_level(30) == 'C1'
    assert map_sequence_to_difficulty_level(36) == 'C2'


def test_max_difficulty_level_returns_higher_level():
    assert max_difficulty_level('A1', 'C2') == 'C2'
    assert max_difficulty_level('B2', 'B1') == 'B2'
