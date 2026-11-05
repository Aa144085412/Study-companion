import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/zip_reference.py'


class ReferenceZipTests(unittest.TestCase):
    def test_note_and_relative_images_survive_zip(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); folder = root / 'bundle'; (folder / 'images').mkdir(parents=True)
            (folder / 'note.md').write_text('![G01](images/G01.jpg)', encoding='utf-8')
            (folder / 'images/G01.jpg').write_bytes(b'image')
            result = subprocess.run([sys.executable, str(SCRIPT), str(folder), str(root / 'bundle.zip')], capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with zipfile.ZipFile(root / 'bundle.zip') as archive:
                self.assertEqual(set(archive.namelist()), {'note.md', 'images/G01.jpg'})
                self.assertEqual(archive.read('images/G01.jpg'), b'image')

    def test_archive_cannot_be_written_inside_bundle(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            result = subprocess.run([sys.executable, str(SCRIPT), str(folder), str(folder / 'bad.zip')], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((folder / 'bad.zip').exists())
