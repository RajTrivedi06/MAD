#!/usr/bin/env python3
"""
scripts/index_labs.py

1) Reads each JSON file from ./lab_json/
2) Uploads it to your Supabase Storage bucket 'labs'
3) Generates a text embedding via OpenAI
4) Inserts (url, embedding) into public.labs_index
   (lab_id is auto‐generated)
"""

import os
import json
from pathlib import Path

# load your environment and config
from app.core.config import get_openai, get_settings
from app.services.supabase_client import supabase

# ── CONFIG ───────────────────────────────────────────────────────────────────
openai = get_openai()
settings = get_settings()
STORAGE_BUCKET = "labs"             # your public bucket
LAB_JSON_DIR   = "app/data/lab_json"       # per-lab JSONs here
EMBED_MODEL    = "text-embedding-3-large"

# ── MAIN LOOP ───────────────────────────────────────────────────────────────────
for fname in os.listdir(LAB_JSON_DIR):
    if not fname.lower().endswith(".json"):
        continue

    path = os.path.join(LAB_JSON_DIR, fname)

    # 1) Upload to Supabase Storage
    with open(path, "rb") as f:
        upload_res = supabase.storage.from_(STORAGE_BUCKET).upload(
            fname, f, {"upsert": "true"}
        )
    if upload_res.status_code >= 400:
        print(f"❌ Upload failed for {fname}: {upload_res.status_code}")
        continue

    # 2) Get public URL (string)
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(fname)

    # 3) Load JSON & build text for embedding
    lab = json.load(open(path, encoding="utf-8"))
    emb_text = (
        f"{lab.get('labName','')}. "
        f"Professor’s summary: {lab.get('researchSummaryProfessor','')}. "
        f"Interests: {', '.join(lab.get('researchInterestsProfessor', []))}. "
        f"Lab summary: {lab.get('labResearchSummary','')}."
    )

    # 4) Generate embedding
    resp   = openai.embeddings.create(input=[emb_text], model=EMBED_MODEL)
    vector = resp.data[0].embedding  # list of floats

    # 5) Insert into labs_index, catching any exception
    record = {"url": public_url, "embedding": vector}
    try:
        supabase.table("labs_index").insert(record).execute()
    except Exception as err:
        print(f"❌ DB insert failed for {fname}: {err}")
        continue

    print(f"✅ Indexed {fname} → {public_url}")

print("🏁 All labs processed and indexed!")