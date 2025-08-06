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
    Fetches every enrollmentPackage, then groups by lecture,
    and enriches each with per-instructor GPA info.
    Returns:
      {
        "course_avg_gpa": 3.01,
        "sections": [ ... ]  # no course_avg_gpa inside each section
      }
    """
    # 1) Get live section data
    url = f"{BASE_URL}/enrollmentPackages/{term}/{subject}/{course_id_str}"
    resp = requests.get(url)
    resp.raise_for_status()
    pkgs = resp.json() or []
    sections = parse_sections(pkgs)

    # 2) Open a DB connection once
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Extract the true course_id from the URL fragment:
            # the last path segment, stripping leading zeros.
            raw_id = course_id_str.lstrip("0")
            course_id = int(raw_id) if raw_id.isdigit() else None

            # 3) Compute the overall course average (once)
            if course_id:
                cur.execute("""
                    SELECT AVG(avg_gpa)::numeric(3,2) AS avg_gpa
                      FROM instructor_course_gpa
                     WHERE course_id = %s
                """, (course_id,))
                r = cur.fetchone()
                course_avg = float(r["avg_gpa"]) if r and r["avg_gpa"] is not None else None
            else:
                course_avg = None

            # 4) For each section, only attach per-instructor GPAs
            for grp in sections:
                instr_gpas = {}
                for prof in grp["lecture"]["professors"]:
                    first, last = (prof.strip().split(None,1) + [""])[:2]
                    # strict match
                    cur.execute("""
                        SELECT instructor_id
                          FROM instructors
                         WHERE first_name = %s AND last_name = %s
                         LIMIT 1
                    """, (first.upper(), last.upper()))
                    inst = cur.fetchone()

                    if not inst:
                        # full_name fallback
                        cur.execute("""
                            SELECT instructor_id
                              FROM instructors
                             WHERE full_name ILIKE %s
                             LIMIT 1
                        """, (f"%{prof.upper()}%",))
                        inst = cur.fetchone()

                    if inst and course_id:
                        iid = inst["instructor_id"]
                        cur.execute("""
                            SELECT avg_gpa
                              FROM instructor_course_gpa
                             WHERE course_id = %s AND instructor_id = %s
                        """, (course_id, iid))
                        gr = cur.fetchone()
                        instr_gpas[prof] = float(gr["avg_gpa"]) if gr else None
                    else:
                        instr_gpas[prof] = None

                # attach only per-instructor GPAs
                grp["lecture"]["instructor_gpas"] = instr_gpas
                grp["discussions"] = [
                    {**d, "instructor_gpas": instr_gpas} for d in grp["discussions"]
                ]
                grp["labs"] = [
                    {**l, "instructor_gpas": instr_gpas} for l in grp["labs"]
                ]

    finally:
        conn.close()

    # 5) return with course_avg_gpa at top level
    return {
        "course_avg_gpa": course_avg,
        "sections": sections
    }
