# core/live_section_info.py

import requests
import re
from urllib.parse import quote_plus

import psycopg2
from psycopg2.extras import RealDictCursor

from app.core.config import get_db_connection

BASE_URL = "https://public.enroll.wisc.edu/api/search/v1"

def ms_to_hhmm(ms):
    if ms is None:
        return None
    secs = ms // 1000
    h, r = divmod(secs, 3600)
    m = r // 60
    return f"{h:02d}:{m:02d}"

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def make_building_slug(building_name: str) -> str:
    bn = building_name.strip()
    for suffix in (" Hall", " Building"):
        if bn.lower().endswith(suffix.lower()):
            bn = bn[:-len(suffix)]
            break
    return slugify(bn)

def _extract_section(sec, pkg_status, pkg_online):
    info = {
        "section_number":   sec.get("sectionNumber"),
        "session_code":     sec.get("sessionCode"),
        "type":             sec.get("type"),
        "status":           pkg_status,
        "instruction_mode": sec.get("instructionMode"),
        "online_only":      pkg_online,
    }

    insts = sec.get("instructors", [])
    prof_names = [f"{i['name']['first']} {i['name']['last']}" for i in insts]
    info["professors"]       = prof_names
    info["professor_emails"] = [i.get("email") for i in insts]

    en = sec.get("enrollmentStatus", {})
    info["capacity"]       = en.get("capacity")
    info["open_seats"]     = en.get("openSeats")
    info["waitlist_spots"] = en.get("openWaitlistSpots")

    meetings = []
    for m in sec.get("classMeetings", []):
        if m.get("meetingType") != "CLASS":
            continue

        days  = "" if pkg_online else (
            m.get("meetingDays")
            or ", ".join(m.get("meetingDaysList", []))
        )
        start = ms_to_hhmm(m.get("meetingTimeStart"))
        end   = ms_to_hhmm(m.get("meetingTimeEnd"))

        bld  = m.get("building") or {}
        code = bld.get("buildingCode")
        name = bld.get("buildingName")
        room = m.get("room")

        map_url = f"https://map.wisc.edu/?initObj={quote_plus(code)}" if code else None
        av_url = None
        if name and room:
            slug   = make_building_slug(name)
            av_url = f"https://av.fpm.wisc.edu/{slug}-{room}/"

        location = f"{room} {name}" if room and name else name or room

        meetings.append({
            "days":     days,
            "start":    start,
            "end":      end,
            "location": location,
            "map_url":  map_url,
            "av_url":   av_url,
        })

    info["meetings"] = meetings
    return info

def parse_sections(pkg_list):
    grouped = {}
    for pkg in pkg_list:
        status_flag = pkg.get("packageEnrollmentStatus", {}).get("status")
        online_flag = pkg.get("onlineOnly", False)

        lec_secs, dis_secs, lab_secs = [], [], []
        for sec in pkg.get("sections", []):
            extracted = _extract_section(sec, status_flag, online_flag)
            t = sec.get("type", "").upper()
            if t == "LEC":
                lec_secs.append(extracted)
            elif t == "DIS":
                dis_secs.append(extracted)
            else:
                lab_secs.append(extracted)

        for lec in lec_secs:
            key = (lec["section_number"], lec["session_code"])
            if key not in grouped:
                grouped[key] = {"lecture": lec, "discussions": [], "labs": []}
            grouped[key]["discussions"].extend(dis_secs)
            grouped[key]["labs"].extend(lab_secs)

    return list(grouped.values())

def fetch_sections(term, subject, course_id_str):
    """
    Fetches every enrollmentPackage for this course, groups by lecture,
    then enriches each with:
      - course_avg_gpa
      - per-instructor GPAs
      - per-instructor RMP ratings
      - subcourse_title & subcourse_description (for topics courses)
    Returns:
      {
        "course_avg_gpa": 3.01,
        "sections": [ … ]
      }
    """
    # ——————————————————————————————————————————————————————————————————————————
    # 1) Determine numeric course_id and whether it's a topics course
    raw_id = course_id_str.lstrip("0")
    cid = int(raw_id) if raw_id.isdigit() else None

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT topic_type FROM courses WHERE course_id = %s",
                (cid,)
            )
            rec = cur.fetchone()
            is_topic = bool(rec and rec.get("topic_type"))
    finally:
        conn.close()

    # ——————————————————————————————————————————————————————————————————————————
    # 2) Get live section data
    url = f"{BASE_URL}/enrollmentPackages/{term}/{subject}/{course_id_str}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        pkgs = resp.json() or []
    except requests.RequestException:
        return {"course_avg_gpa": None, "sections": []}

    # 3) Parse into lecture/discussion/lab groups
    sections = parse_sections(pkgs)

    # ——————————————————————————————————————————————————————————————————————————
    # 4) Annotate each group with its subcourse title/description
    #    (pulling from pkg["sections"][0]["topic"] when is_topic)
    group_map = {
        (grp["lecture"]["section_number"], grp["lecture"]["session_code"]): grp
        for grp in sections
    }
    for pkg in pkgs:
        # fallback to courseTitle/catalogDescription
        title = pkg.get("courseTitle") or pkg.get("catalogDescription")
        desc  = pkg.get("catalogDescription") or pkg.get("description")

        # override if this *is* a topics course
        if is_topic and pkg.get("sections"):
            first_sec = pkg["sections"][0]
            topic     = first_sec.get("topic", {})
            if topic.get("shortDescription"):
                title = topic["shortDescription"]
            if topic.get("longDescription"):
                desc = topic["longDescription"]

        # inject into the matching lecture dict
        for sec in pkg.get("sections", []):
            if sec.get("type", "").upper() != "LEC":
                continue
            key = (sec.get("sectionNumber"), sec.get("sessionCode"))
            if key in group_map:
                grp = group_map[key]
                grp["lecture"]["subcourse_title"]       = title
                grp["lecture"]["subcourse_description"] = desc
            break

    # ensure keys exist (even if null)
    for grp in sections:
        grp["lecture"].setdefault("subcourse_title", None)
        grp["lecture"].setdefault("subcourse_description", None)

    # ——————————————————————————————————————————————————————————————————————————
    # 5) DB-side enrichment: overall GPA, per-instructor GPAs & RMP
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # overall course average GPA
            if cid:
                cur.execute("""
                    SELECT AVG(avg_gpa)::numeric(3,2) AS avg_gpa
                      FROM instructor_course_gpa
                     WHERE course_id = %s
                """, (cid,))
                r = cur.fetchone()
                course_avg = float(r["avg_gpa"]) if r and r["avg_gpa"] is not None else None
            else:
                course_avg = None

            # enrich each section group
            for grp in sections:
                # — build GPA map —
                instr_gpas = {}
                for prof in grp["lecture"]["professors"]:
                    first, last = (prof.strip().split(None,1) + [""])[:2]
                    cur.execute("""
                        SELECT instructor_id
                          FROM instructors
                         WHERE first_name = %s AND last_name = %s
                         LIMIT 1
                    """, (first.upper(), last.upper()))
                    inst = cur.fetchone()
                    if not inst:
                        cur.execute("""
                            SELECT instructor_id
                              FROM instructors
                             WHERE full_name ILIKE %s
                             LIMIT 1
                        """, (f"%{prof.upper()}%",))
                        inst = cur.fetchone()

                    if inst and cid:
                        iid = inst["instructor_id"]
                        cur.execute("""
                            SELECT avg_gpa
                              FROM instructor_course_gpa
                             WHERE course_id = %s AND instructor_id = %s
                        """, (cid, iid))
                        gr = cur.fetchone()
                        instr_gpas[prof] = float(gr["avg_gpa"]) if gr and gr["avg_gpa"] is not None else None
                    else:
                        instr_gpas[prof] = None

                # — build RMP map —
                rmp_ratings = {}
                for prof in grp["lecture"]["professors"]:
                    first, last = (prof.strip().split(None,1) + [""])[:2]
                    cur.execute("""
                        SELECT rmp_avg_rating, rmp_avg_difficulty,
                               rmp_num_ratings, rmp_would_take_again_percent
                          FROM public.instructors
                         WHERE first_name = %s AND last_name = %s
                         LIMIT 1
                    """, (first.upper(), last.upper()))
                    rmp = cur.fetchone()
                    if not rmp:
                        cur.execute("""
                            SELECT rmp_avg_rating, rmp_avg_difficulty,
                                   rmp_num_ratings, rmp_would_take_again_percent
                              FROM public.instructors
                             WHERE full_name ILIKE %s
                             LIMIT 1
                        """, (f"%{prof.upper()}%",))
                        rmp = cur.fetchone()

                    if rmp:
                        rmp_ratings[prof] = {
                            "avg_rating":               float(rmp["rmp_avg_rating"])               if rmp["rmp_avg_rating"]               is not None else None,
                            "avg_difficulty":           float(rmp["rmp_avg_difficulty"])           if rmp["rmp_avg_difficulty"]           is not None else None,
                            "num_ratings":              int(rmp["rmp_num_ratings"])               if rmp["rmp_num_ratings"]               is not None else None,
                            "would_take_again_percent": float(rmp["rmp_would_take_again_percent"]) if rmp["rmp_would_take_again_percent"] is not None else None,
                        }
                    else:
                        rmp_ratings[prof] = {
                            "avg_rating": None,
                            "avg_difficulty": None,
                            "num_ratings": None,
                            "would_take_again_percent": None,
                        }

                # attach into response schema
                grp["lecture"]["instructor_gpas"] = instr_gpas
                grp["lecture"]["rmp_ratings"]     = rmp_ratings
                grp["discussions"] = [
                    {**d, "instructor_gpas": instr_gpas, "rmp_ratings": rmp_ratings}
                    for d in grp["discussions"]
                ]
                grp["labs"] = [
                    {**l, "instructor_gpas": instr_gpas, "rmp_ratings": rmp_ratings}
                    for l in grp["labs"]
                ]

    finally:
        conn.close()

    return {
        "course_avg_gpa": course_avg,
        "sections":      sections
    }
