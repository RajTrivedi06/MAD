# scripts/split_subjects.py

import os
import json
import re
from collections import Counter

RAW_DIR = "./subject_jsons"  # your batched subject files here
OUT_DIR = "./lab_json"           # per‐lab JSONs will go here

os.makedirs(OUT_DIR, exist_ok=True)

def slugify(s: str) -> str:
    """Lowercase, replace non‐alphanumeric with '_', strip leading/trailing '_'."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_") or "lab"

def make_lab_slug(lab: dict, subject: str, idx: int) -> str:
    """
    1) Try lab['labName']
    2) If missing/empty or contains 'no_formal_lab', use lab['professor']['name']
    3) If still missing, fallback to subject+idx
    """
    raw_name = lab.get("labName") or ""
    name_slug = slugify(raw_name)

    if not raw_name or "no_formal_lab" in name_slug:
        prof_name = lab.get("professor", {}).get("name", "")
        name_slug = slugify(prof_name)

    if not name_slug:
        name_slug = f"{subject}_{idx}"

    return f"{slugify(subject)}_{name_slug}"

for fname in os.listdir(RAW_DIR):
    if not fname.endswith(".json"):
        continue

    subject = os.path.splitext(fname)[0]
    path    = os.path.join(RAW_DIR, fname)

    with open(path, "r", encoding="utf-8") as f:
        labs = json.load(f)
        if not isinstance(labs, list):
            print(f"⚠ {fname} is not a list; skipping.")
            continue

    # track duplicates to append index if needed
    slug_counts = Counter()

    for idx, lab in enumerate(labs, start=1):
        base_slug = make_lab_slug(lab, subject, idx)
        slug_counts[base_slug] += 1

        # if this slug already used, append count
        if slug_counts[base_slug] > 1:
            lab_slug = f"{base_slug}_{slug_counts[base_slug]}"
        else:
            lab_slug = base_slug

        out_path = os.path.join(OUT_DIR, f"{lab_slug}.json")
        with open(out_path, "w", encoding="utf-8") as g:
            json.dump(lab, g, ensure_ascii=False, indent=2)

        print(f"→ Wrote {out_path}")
