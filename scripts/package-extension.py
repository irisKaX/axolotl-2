"""Package the actual bridge sources reproducibly for download and Pages CI."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

source = Path('browser-extension')
output = Path('public/downloads/axolotl-prohlizec.zip')
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(source.rglob('*')):
        if not path.is_file() or '__pycache__' in path.parts:
            continue
        entry = ZipInfo('axolotl-prohlizec/' + path.relative_to(source).as_posix(), (2026, 10, 15, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, path.read_bytes(), compresslevel=9)
print(f'Packaged {output} ({output.stat().st_size} bytes)')
