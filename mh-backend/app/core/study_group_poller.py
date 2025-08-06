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
def run_matching():
    conn = get_db_connection()
    cur  = conn.cursor()

    # 1) fetch all requests
    cur.execute("SELECT id, profile_id, course_id FROM study_group_requests")
    for req_id, req_profile, course_id in cur.fetchall():
        # 2) find peers and get human-readable code
        cur.execute("""
          SELECT uc.profile_id, u.email, c.course_code
            FROM user_inprogress_courses uc
            JOIN auth.users   u ON u.id = uc.profile_id
            JOIN courses      c ON c.course_id = uc.course_id
           WHERE uc.course_id = %s
             AND uc.profile_id <> %s
        """, (course_id, req_profile))

        for prof_id, email_addr, course_code in cur.fetchall():
            # 3) skip if already contacted
            cur.execute("""
              SELECT 1
                FROM study_group_contacts
               WHERE request_id = %s
                 AND contacted_profile_id = %s
            """, (req_id, prof_id))
            if cur.fetchone():
                continue

            # 4) log contact & retrieve agree_token
            cur.execute("""
              INSERT INTO study_group_contacts
                (request_id, contacted_profile_id)
              VALUES (%s, %s)
              RETURNING agree_token
            """, (req_id, prof_id))
            token = cur.fetchone()[0]
            conn.commit()

            # 5) send one-click link with the course_code
            link = f"{BACKEND_URL}/api/study-groups/agree/{token}"
            subj = f"Study-group opportunity in {course_code}"
            body = (
                f"Hi there!\n\n"
                f"Someone in **{course_code}** is looking for a study group.\n\n"
                f"If you’d like to join, click here:\n{link}\n\n"
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
