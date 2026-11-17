from pathlib import Path
import zipfile
root = Path(__file__).resolve().parent.parent
out = root/'public'/'downloads'/'ai-product-research.zip'
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root/'skills'/'ai-product-research').rglob('*')):
        if p.is_file(): z.write(p, p.relative_to(root/'skills'))
print(out)
