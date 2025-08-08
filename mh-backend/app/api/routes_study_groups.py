from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.core.config import get_db_connection
from app.core.study_group_poller import send_email

router = APIRouter(prefix="/study-groups", tags=["study-groups"])

@router.get("/agree/{token}")
def agree(token: UUID):
    db = get_db_connection()
    cur = db.cursor()

    # 1) lookup contact row
    cur.execute("""
      SELECT request_id, contacted_profile_id, user_agreed
        FROM study_group_contacts
       WHERE agree_token = %s
    """, (str(token),))
    row = cur.fetchone()
    if not row:
        cur.close()
        db.close()
        raise HTTPException(404, "Invalid or expired link")

    req_id, prof_id, already = row
    if already:
        cur.close()
        db.close()
        return {"status": "ok", "msg": "Already agreed"}

    # 2) mark as agreed
    cur.execute("""
      UPDATE study_group_contacts
         SET user_agreed = TRUE,
             agreed_at   = NOW()
       WHERE agree_token = %s
    """, (str(token),))
    db.commit()

    # 3) fetch requester email and course_code
    cur.execute("""
      SELECT u.email, c.course_code
        FROM study_group_requests r
        JOIN auth.users u  ON u.id = r.profile_id
        JOIN courses     c ON c.course_id = r.course_id
       WHERE r.id = %s
    """, (req_id,))
    requester_email, course_code = cur.fetchone()

    # 4) fetch connector’s email
    cur.execute("""
      SELECT u.email
        FROM auth.users u
       WHERE u.id = %s
    """, (prof_id,))
    connector_email = cur.fetchone()[0]

    # 5) send final connect emails
    subject = f"Study-group match for {course_code}"
    send_email(
        requester_email,
        subject,
        f"{connector_email} has joined your **{course_code}** study-group request #{req_id}.\n"
        f"Email them at: {connector_email}."
    )
    send_email(
        connector_email,
        subject,
        f"You’re connected with {requester_email} for **{course_code}** study-group request #{req_id}.\n"
        f"Email them at: {requester_email}."
    )

    cur.close()
    db.close()
    return {"status": "ok"}
