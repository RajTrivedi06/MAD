import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from openai import OpenAI
import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np

from app.core.config import get_openai, get_db_connection

OPENAI_EMBED_MODEL  = "text-embedding-3-large"  # 3072 dims
TRIM_MODEL          = "gpt-3.5-turbo"
INTEREST_TRIM_MODEL = "gpt-4o-mini"

TRIM_SCHEMA = {
  "research_interests":       "list of strings – topics you want to study",
  "relevant_courses_taken":   "list of strings – courses you’ve taken or are currently taking",
  "ideal_research_areas":     "list of strings – fields or problems you’d like to work on",
  "expertise":                "list of strings – your core methodologies & skills",
  "unique_value_proposition": "string – what makes you stand out as a researcher"
}

def trim_profile_with_gpt(raw_profile: Dict[str, Any]) -> Dict[str, Any]:
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
      {"role": "system", "content": system_msg},
      {"role": "user",   "content": user_msg},
    ],
    temperature=0
  )
  return json.loads(resp.choices[0].message.content)

def embed_text(text: str) -> List[float]:
  openai: OpenAI = get_openai()
  resp = openai.embeddings.create(input=[text], model=OPENAI_EMBED_MODEL)
  return resp.data[0].embedding

def trim_interest_with_gpt(raw_interest: str) -> str:
  openai: OpenAI = get_openai()
  prompt = f"""
You are cleaning a student's research interest statement for embedding.
Keep only concrete topics, methods, data types, organisms/systems, and goals.
Remove filler, coursework descriptions, and generic adjectives.
Return a SHORT plain text result (4–8 bullets or a tight paragraph). No JSON.

--- RAW INTEREST ---
{raw_interest}
"""
  resp = openai.chat.completions.create(
    model=INTEREST_TRIM_MODEL,
    messages=[
      {"role": "system", "content": "You write concise technical summaries."},
      {"role": "user",   "content": prompt},
    ],
    temperature=0.2,
  )
  return resp.choices[0].message.content.strip()

def get_interest_embedding(interest: str) -> List[float]:
  cleaned = trim_interest_with_gpt(interest)
  return embed_text(cleaned)

def _fetch_profile_summary_text(user_id: UUID) -> str:
  conn = get_db_connection()
  try:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
      cur.execute(
        "SELECT profile_summary::text AS summary_json FROM public.profiles WHERE id = %s;",
        (str(user_id),)
      )
      row = cur.fetchone()
      if not row or not row["summary_json"]:
        raise RuntimeError(f"No profile_summary for user {user_id}")
      raw = json.loads(row["summary_json"])
  finally:
    conn.close()

  trimmed = trim_profile_with_gpt(raw)
  return json.dumps(trimmed)

def get_profile_embedding(user_id: UUID) -> List[float]:
  text = _fetch_profile_summary_text(user_id)
  return embed_text(text)

def get_combined_embedding(interest: Optional[str], user_id: UUID) -> List[float]:
  """
  Weighted blend of (trimmed interest) + (trimmed profile).
  If interest missing, returns profile-only embedding.
  """
  profile_text = _fetch_profile_summary_text(user_id)
  emb_profile = embed_text(profile_text)

  if not interest:
    return emb_profile

  cleaned_interest = trim_interest_with_gpt(interest)
  emb_interest = embed_text(cleaned_interest)

  alpha = 0.7  # interest weight
  combined = alpha * np.array(emb_interest) + (1 - alpha) * np.array(emb_profile)
  return combined.tolist()

def find_lab_matches(user_emb: List[float], top_n: int = 5) -> List[Dict[str, Any]]:
  """
  Cosine similarity search via pgvector.
  """
  conn = get_db_connection()
  try:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
