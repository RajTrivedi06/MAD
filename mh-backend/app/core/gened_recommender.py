from typing import List, Dict, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import get_openai, get_db_connection
import ast

openai = get_openai()
conn = get_db_connection()
REFINE_MODEL = "gpt-3.5-turbo"

def refine_interest(raw: str) -> str:
    system = (
        "You are a course recommender assistant. "
        "Rewrite the student’s interest into 2–3 short, comma-separated noun phrases "
        "in all lowercase, packed with academic keywords for cosine similarity matching. "
        "Do NOT use full sentences, question marks, or labels."
    )
    user = f"interest: \"{raw}\""
    resp = openai.chat.completions.create(
        model=REFINE_MODEL,
        messages=[{"role":"system","content":system},
                  {"role":"user","content":user}],
        temperature=0.7,
        max_tokens=64
    )
    return resp.choices[0].message.content.strip()

def embed(text: str, model: str) -> np.ndarray:
    resp = openai.embeddings.create(model=model, input=[text])
    return np.array(resp.data[0].embedding, dtype=float)

def fetch_candidates(section: str, subsection: str) -> List[int]:
    is_gened = section.lower().startswith("university general education")
    col = "gened_and" if is_gened else "breadth_or"
    sql = f"SELECT course_id FROM course_requirements WHERE %s = ANY({col})"
    with conn.cursor() as cur:
        cur.execute(sql, (subsection,))
        return [r[0] for r in cur.fetchall()]

def fetch_popular(section: str, sub_name: str, limit: int) -> List[int]:
    raw_cat, raw_req = section.split(":",1)
    CATEGORY_MAP = {
        "university general education": "University General Education",
        "breadth in the degree":        "L&S Breadth"
    }
    category    = CATEGORY_MAP.get(raw_cat.strip().lower(), raw_cat.strip().title())
    requirement = raw_req.strip()
    college     = "L&S"
    sql = """
      SELECT course_id
        FROM requirement_popularity
       WHERE college = %s
         AND category = %s
         AND requirement = %s
         AND sub_requirement = %s
    ORDER BY student_count DESC
       LIMIT %s
    """
    with conn.cursor() as cur:
        cur.execute(sql, (college, category, requirement, sub_name, limit))
        return [r[0] for r in cur.fetchall()]

def fetch_course_data(ids: List[int], emb_col: str) -> List[Dict]:
    if not ids:
        return []
    placeholders = ",".join("%s" for _ in ids)
    sql = f"""
        SELECT course_id, course_code, catalog_number, title, {emb_col}
          FROM courses
         WHERE course_id IN ({placeholders})
    """
    with conn.cursor() as cur:
        cur.execute(sql, ids)
        rows = cur.fetchall()

    results = []
    for row in rows:
        raw_emb = row[4]
        # parse the string repr into a Python list
        emb_list = ast.literal_eval(raw_emb) if isinstance(raw_emb, str) else raw_emb
        results.append({
            "id":    row[0],
            "code":  row[1],
            "num":   row[2],
            "title": row[3],
            "emb":   np.array(emb_list, dtype=float)
        })
    return results
def recommend(
    section: str,
    subsection: str,
    interest: Optional[str],
    mode: str = "broad",
    top_k: int = 10
) -> List[Dict]:
    emb_col = "embedding_small" if mode=="broad" else "embedding_large"
    model   = "text-embedding-3-small" if mode=="broad" else "text-embedding-3-large"
    refined = refine_interest(interest or "")
    if not refined:
        ids = fetch_popular(section, subsection, top_k)
    else:
        ids = fetch_candidates(section, subsection)
    if not ids:
        return []
    courses = fetch_course_data(ids, emb_col)
    if refined:
        q_emb = embed(refined, model)
        embs  = np.stack([c["emb"] for c in courses])
        sims  = cosine_similarity(embs, q_emb.reshape(1,-1)).flatten()
        top   = np.argsort(sims)[::-1][:top_k]
        return [
            {"course_id":courses[i]["id"],
             "course_code":courses[i]["code"],
             "catalog_number":courses[i]["num"],
             "title":courses[i]["title"],
             "similarity":float(sims[i])}
            for i in top
        ]
    else:
        # popularity path
        return [
            {"course_id":cid, "similarity":None}
            for cid in ids
        ]
