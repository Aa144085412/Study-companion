"""Package an already validated, local reference bundle using the standard library."""
import sys
import zipfile
from pathlib import Path

if __name__ == '__main__':
    folder = Path(sys.argv[1]).resolve(strict=True)
    output = Path(sys.argv[2]).resolve()
    if not folder.is_dir() or output.parent != folder.parent or output.suffix != '.zip':
        raise ValueError('archive must be a sibling ZIP of the prepared bundle directory')
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(folder.rglob('*')):
            if file.is_file():
                if not file.resolve().is_relative_to(folder):
                    raise ValueError('bundle file points outside prepared directory')
                archive.write(file, file.relative_to(folder).as_posix())
