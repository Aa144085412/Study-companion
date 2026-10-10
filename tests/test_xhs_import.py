import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('import_xhs', Path(__file__).resolve().parents[1] / 'scripts/import_xhs.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class InventoryTests(unittest.TestCase):
    def test_only_complete_image_notes_with_safe_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / 'data/xhs'
            data.mkdir(parents=True)
            notes = []
            for note_id, kind, urls in [('complete', 'normal', 'url1'), ('partial', 'normal', 'url1,url2'), ('video', 'video', 'url1'), ('../escape', 'normal', 'url1')]:
                if '/' not in note_id:
                    images = data / 'media' / note_id
                    images.mkdir(parents=True)
                    (images / '001.jpg').write_bytes(b'fixture')
                notes.append({'note_id': note_id, 'type': kind, 'source_keyword': 'test', 'image_list': urls})
            (data / 'notes.jsonl').write_text('\n'.join(json.dumps(n) for n in notes), encoding='utf-8')
            records = module.inventory(root, ['test'])
            self.assertEqual([r[0]['note_id'] for r in records], ['complete'])
            self.assertEqual(module.inventory(root, ['other']), [])

    def test_bad_json_is_not_silently_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'data/xhs').mkdir(parents=True)
            (root / 'data/xhs/notes.jsonl').write_text('{bad json', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Invalid JSONL'):
                module.inventory(root, ['test'])


if __name__ == '__main__':
    unittest.main()
