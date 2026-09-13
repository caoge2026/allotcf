import copy
import importlib.util
import json
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('migrate_database', Path(__file__).parents[1] / 'migrate_database.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_baseline_accepts_only_identical_structure():
    expected = json.loads(MODULE.MANIFEST.read_text())
    assert MODULE.differences(expected, copy.deepcopy(expected)) == []
    changed = copy.deepcopy(expected)
    changed['practice_session']['columns'][0][1] = 'int'
    assert MODULE.differences(changed, expected) == ['practice_session']


def test_baseline_rejects_extra_tables_missing_columns_or_foreign_keys():
    expected = json.loads(MODULE.MANIFEST.read_text())
    for mutate in [
        lambda value: value.update(unexpected_table={}),
        lambda value: value['question']['columns'].pop(),
        lambda value: value['speaking_attempts']['references'].clear(),
        lambda value: value['users']['indexes'].clear(),
    ]:
        changed = copy.deepcopy(expected)
        mutate(changed)
        assert MODULE.differences(changed, expected)
