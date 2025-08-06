# app/services/recommender.py

import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from openai import OpenAI
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np  # added for weighted combination

from app.core.config import get_openai, get_db_connection

# models and constants
OPENAI_EMBED_MODEL = "text-embedding-3-large"
TRIM_MODEL         = "gpt-3.5-turbo"
TRIM_SCHEMA        = {
    "research_interests":       "list of strings – topics you want to study",
    "relevant_courses_taken":   "list of strings – courses you’ve taken or are currently taking",
    "ideal_research_areas":     "list of strings – fields or problems you’d like to work on",
    "expertise":                "list of strings – your core methodologies & skills",
    "unique_value_proposition": "string – what makes you stand out as a researcher"
}


def trim_profile_with_gpt(raw_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Call GPT to extract exactly the five generic buckets from any profile_summary JSON."""
    openai: OpenAI = get_openai()
    system_msg = (
        "You are a JSON extractor. Given an arbitrary profile_summary JSON, "
        "return a JSON object with exactly these keys and types and do not add any extra text or remove keys from the response:\n"
        f"{json.dumps(TRIM_SCHEMA, indent=2)}"
    )
    user_msg = "Here is the raw profile_summary JSON:\n" + json.dumps(raw_profile, indent=2)

    resp = openai.chat.completions.create(
        model=TRIM_MODEL,
        messages=[
            {"role": "system",  "content": system_msg},
            {"role": "user",    "content": user_msg}
        ],
        temperature=0
    )
    return json.loads(resp.choices[0].message.content)


def embed_text(text: str) -> List[float]:
    """Helper to call OpenAI embeddings."""
    openai: OpenAI = get_openai()
    resp = openai.embeddings.create(input=[text], model=OPENAI_EMBED_MODEL)
    return resp.data[0].embedding


def get_interest_embedding(interest: str) -> List[float]:
    """Embed just the free-form interest statement."""
    return embed_text(interest)


def get_profile_embedding(user_id: UUID) -> List[float]:
    """
    Fetch raw profile_summary from Postgres, trim it via GPT,
    then embed the resulting JSON dump as text.
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT profile_summary::text AS summary_json "
                "FROM public.profiles WHERE id = %s;",
                (str(user_id),)
            )
            row = cur.fetchone()
            if not row or not row["summary_json"]:
                raise RuntimeError(f"No profile_summary for user {user_id}")
            raw = json.loads(row["summary_json"])
    finally:
        conn.close()

    trimmed = trim_profile_with_gpt(raw)
    text = json.dumps(trimmed)
    return embed_text(text)


def get_combined_embedding(interest: Optional[str], user_id: UUID) -> List[float]:
    """
    Combine (interest + trimmed profile) into one embedding via weighted average.
    If interest is None or empty, returns the profile-only embedding.
    """
    # fetch & trim profile
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT profile_summary::text AS summary_json "
                "FROM public.profiles WHERE id = %s;",
                (str(user_id),)
            )
            row = cur.fetchone()
            if not row or not row["summary_json"]:
                raise RuntimeError(f"No profile_summary for user {user_id}")
            raw = json.loads(row["summary_json"])
    finally:
        conn.close()

    trimmed = trim_profile_with_gpt(raw)
    profile_text = json.dumps(trimmed)

    # embed profile
    emb_profile = embed_text(profile_text)

    # if no interest provided, just return profile embedding
    if not interest:
        return emb_profile

    # embed interest
    emb_interest = embed_text(interest)

    # weighted average: tune alpha as desired (e.g. 0.7)
    alpha = 0.7
    combined = alpha * np.array(emb_interest) + (1 - alpha) * np.array(emb_profile)
    return combined.tolist()


def find_lab_matches(user_emb: List[float], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Query Postgres to run cosine-similarity search via pgvector.
    Returns rows of { lab_id, url, similarity }.
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # user_emb as JSON array literal, cast to vector
            emb_literal = json.dumps(user_emb)
            cur.execute(
                """
                SELECT
                  lab_id,
                  url,
                  1.0 - (embedding <#> %s::vector) AS similarity
                FROM public.labs_index
                ORDER BY similarity DESC
                LIMIT %s;
                """,
                (emb_literal, top_n)
            )
            results = cur.fetchall()
    finally:
        conn.close()

    return results
