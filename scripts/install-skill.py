#!/usr/bin/env python3
"""Install bundled skill; refuse to overwrite an existing installation."""
import argparse
import os
from pathlib import Path
import shutil
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--client', choices=['codex', 'claude'], default='codex')
p.add_argument('--destination', type=Path, help='Skills parent directory')
a = p.parse_args()
source = Path(__file__).resolve().parent.parent/'skills'/'ai-product-research'
root = a.destination or (Path.home()/'.agents'/'skills' if a.client == 'codex' else Path.home()/'.claude'/'skills')
target = root.expanduser().resolve()/'ai-product-research'
if target.exists(): p.exit(1, f'Already installed: {target}. Back up and remove it before reinstalling.\n')
if not (source/'SKILL.md').is_file(): p.exit(1, 'Bundled SKILL.md not found. Download the full repository.\n')
root.mkdir(parents=True, exist_ok=True)
shutil.copytree(source, target)
print(f'Installed ai-product-research: {target}')
