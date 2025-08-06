# app/core/section_poller.py

import asyncio
from collections import defaultdict
from psycopg2.extras import RealDictCursor

from app.core.config import get_db_connection
from app.core.live_section_info import fetch_sections
from email.message import EmailMessage
import smtplib
import os

POLL_INTERVAL_SEC = 700  # seconds between runs

# load SMTP from env
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

def send_email(to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)

def parse_section_url(url: str):
    parts = url.rstrip("/").split("/")
    return parts[-3], parts[-2], parts[-1]

def poll_and_notify():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1) load pending requests
            cur.execute("""
                SELECT id, user_id, course_id, section_number,
                       desired_seats, wants_waitlist
                  FROM notification_requests
                 WHERE notified = FALSE
            """)
            rows = cur.fetchall()

            # 2) bucket by course+section
            buckets = defaultdict(list)
            for r in rows:
                buckets[(r["course_id"], r["section_number"])].append(r)

            for (course_id, section_number), reqs in buckets.items():
                # 3) lookup course_code and section_url
                cur.execute(
                    """
                    SELECT course_code, section_url
                      FROM courses
                     WHERE course_id = %s
                    """, (course_id,)
                )
                rec = cur.fetchone()
                if not rec or not rec["section_url"]:
                    continue

                course_code = rec["course_code"]
                term, subj, cat = parse_section_url(rec["section_url"])

                # 4) fetch live data
                try:
                    data = fetch_sections(term, subj, cat)
                except Exception as e:
                    print(f"[WARN] fetch_sections failed for {course_code}: {e}")
                    continue

                # 5) check conditions
                for req in reqs:
                    for sec_group in data["sections"]:
                        lec = sec_group["lecture"]

                        # match on the lecture’s section_number
                        match = req["section_number"] is None \
                                or lec["section_number"] == req["section_number"]
                        has_seats = lec["open_seats"] >= req["desired_seats"]
                        has_wait = req["wants_waitlist"] and lec["waitlist_spots"] > 0

                        if match and (has_seats or has_wait):
                            # 6) get user email
                            cur.execute(
                                "SELECT email FROM auth.users WHERE id = %s",
                                (req["user_id"],)
                            )
                            user = cur.fetchone()
                            if not user:
                                continue

                            # 7) send email with course_code and section only
                            subject = f"{course_code} section {lec['section_number']} now open!"
                            body = (
                                f"{course_code} section {lec['section_number']} now has "
                                f"{lec['open_seats']} open seats & {lec['waitlist_spots']} waitlist spots."
                                f"Go Enroll Now!!"
                            )
                            send_email(user["email"], subject, body)

                            # 8) mark notified
                            cur.execute("""
                                UPDATE notification_requests
                                   SET notified = TRUE,
                                       notified_at = now()
                                 WHERE id = %s
                            """, (req["id"],))
                            conn.commit()
                            break
    finally:
        conn.close()

async def poller_loop():
    """
    Background coroutine: run poll_and_notify every POLL_INTERVAL_SEC.
    """
    while True:
        await asyncio.to_thread(poll_and_notify)
        await asyncio.sleep(POLL_INTERVAL_SEC)
