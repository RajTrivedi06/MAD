# app/core/study_group_poller.py

import os
import asyncio
from email.message import EmailMessage
from smtplib import SMTP
from app.core.config import get_db_connection

# ─ CONFIG ────────────────────────────────────────────────────────────────
SMTP_HOST   = os.getenv("SMTP_HOST")     # e.g. "smtp.gmail.com"
SMTP_PORT   = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER   = os.getenv("SMTP_USER")     # e.g. your bot email
SMTP_PASS   = os.getenv("SMTP_PASS")     # your App Password
FROM_ADDR   = os.getenv("FROM_ADDR")     # same as SMTP_USER
BACKEND_URL = os.getenv("BACKEND_URL")   # e.g. "http://localhost:8000"

# ─ EMAIL UTIL ────────────────────────────────────────────────────────────
def send_email(to_addr: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = FROM_ADDR, to_addr, subject
    msg.set_content(body)
    with SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        if SMTP_USER and SMTP_PASS:
            smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

# ─ MATCHING LOGIC ─────────────────────────────────────────────────────────
# app/core/study_group_poller.py

def run_matching():
    conn = get_db_connection()
    cur  = conn.cursor()

    # 1) fetch all open study-group requests, *including* their custom message
    cur.execute("""
      SELECT r.id
           , r.profile_id
           , r.course_id
           , r.message
        FROM study_group_requests r
    """)
    for req_id, req_profile, course_id, req_message in cur.fetchall():

        # 2) find any other profile whose in_progress_course_ids contains this course_id
        cur.execute("""
          SELECT p.id         AS profile_id
               , u.email      AS email_addr
               , c.course_code
            FROM public.profiles p
            JOIN auth.users   u  ON u.id = p.id
            JOIN courses      c  ON c.course_id = %s
           WHERE %s = ANY(p.in_progress_course_ids)
             AND p.id <> %s
        """, (course_id, course_id, req_profile))

        for prof_id, email_addr, course_code in cur.fetchall():

            # 3) skip if we've already sent them a link
            cur.execute("""
              SELECT 1
                FROM study_group_contacts
               WHERE request_id = %s
                 AND contacted_profile_id = %s
            """, (req_id, prof_id))
            if cur.fetchone():
                continue

            # 4) insert & grab token
            cur.execute("""
              INSERT INTO study_group_contacts
                (request_id, contacted_profile_id)
              VALUES (%s, %s)
              RETURNING agree_token
            """, (req_id, prof_id))
            token = cur.fetchone()[0]
            conn.commit()

            # 5) email them the “click to join” link, *including* the requester’s own message
            link = f"{BACKEND_URL}/api/study-groups/agree/{token}"
            subj = f"Study-group opportunity in {course_code}"
            body = (
                f"Hi there!\n\n"
                f"Someone is looking for a **{course_code}** study group.\n\n"
                f"Here’s what they said:\n\n"
                f"    “{req_message}”\n\n"
                f"If you’d like to join, just click here and we will share contact information to each of you:\n"
                f"{link}\n\n"
                f"—Course Search Helper"
            )
            send_email(email_addr, subj, body)

    cur.close()
    conn.close()


# ─ BACKGROUND POLLER ──────────────────────────────────────────────────────
async def study_group_poller_loop(interval_secs: int = 3600):
    while True:
        try:
            run_matching()
        except Exception as e:
            print("⚠️ study-group poller error:", e)
        await asyncio.sleep(interval_secs)
