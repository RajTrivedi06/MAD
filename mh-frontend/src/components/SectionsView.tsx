import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Mail, MapPin, ExternalLink } from "lucide-react";
import { useSections } from "@/hooks/useSections";
import type { LectureFields, SectionsResponse } from "@/types/sections.types";
import {
  createNotificationRequest,
  type SectionNotifyType,
} from "@/services/notificationsService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warn: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

function statusTone(s: string) {
  const up = s?.toUpperCase?.() || "";
  if (up.includes("OPEN")) return "success";
  if (up.includes("WAIT")) return "warn";
  return "danger";
}

function SeatsRow({
  capacity,
  open,
  waitlist,
}: {
  capacity: number | null;
  open: number | null;
  waitlist: number | null;
}) {
  const cap = capacity ?? 0;
  const openSeats = open ?? 0;
  const wl = waitlist ?? 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <Badge>{`Capacity: ${cap}`}</Badge>
      <Badge
        tone={openSeats > 0 ? "success" : "danger"}
      >{`Open: ${openSeats}`}</Badge>
      <Badge
        tone={wl > 0 ? "warn" : "default"}
      >{`Waitlist spots: ${wl}`}</Badge>
    </div>
  );
}

function ProfRow({
  profs,
  emails,
  gpas,
  rmp,
}: {
  profs: string[];
  emails: string[];
  gpas?: Record<string, number | null>;
  rmp?: SectionsResponse["sections"][number]["lecture"]["rmp_ratings"];
}) {
  if (!profs?.length) return null;
  return (
    <div className="space-y-1">
      {profs.map((name, i) => {
        const email = emails?.[i];
        const g = gpas?.[name] ?? null;
        const r = rmp?.[name];
        return (
          <div
            key={`${name}-${i}`}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{name}</span>
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  {email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {g !== null && <Badge>{`Instructor GPA: ${g.toFixed(2)}`}</Badge>}
              {r && r.avg_rating !== null && (
                <Badge>{`Avg Rating: ${r.avg_rating.toFixed(1)}/5`}</Badge>
              )}
              {r && r.avg_difficulty !== null && (
                <Badge>{`Avg Difficulty: ${r.avg_difficulty.toFixed(
                  1
                )}/5`}</Badge>
              )}
              {r && r.num_ratings !== null && (
                <Badge>{`Ratings: ${r.num_ratings}`}</Badge>
              )}
              {r && r.would_take_again_percent !== null && (
                <Badge>{`Would Take Again: ${Math.round(
                  r.would_take_again_percent
                )}%`}</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Meetings({
  items,
  onlineOnly,
}: {
  items: LectureFields["meetings"];
  onlineOnly: boolean;
}) {
  if (!items?.length) {
    return (
      <p className="text-sm text-gray-600">
        {onlineOnly ? "Asynchronous / Online" : "TBA"}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((m, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {m.days || (onlineOnly ? "Asynchronous / Online" : "TBA")}
            </span>
            {m.start && m.end && (
              <span className="text-gray-700">
                {m.start} – {m.end}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-700">
              {m.location || (onlineOnly ? "Online" : "TBA")}
            </span>
            {m.map_url && (
              <a
                className="text-red-700 hover:underline inline-flex items-center gap-1"
                href={m.map_url}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="w-4 h-4" />
                Map
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {m.av_url && (
              <a
                className="text-gray-700 hover:underline inline-flex items-center gap-1"
                href={m.av_url}
                target="_blank"
                rel="noreferrer"
              >
                AV
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionBlock({
  lecture,
  sectionType,
  onNotify,
  label = "Lecture",
}: {
  lecture: LectureFields;
  sectionType: SectionNotifyType;
  onNotify: (
    sectionType: SectionNotifyType,
    sectionNumber: string | null
  ) => void;
  label?: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge>{label}</Badge>
          <span className="font-semibold text-black">
            Sec {lecture.section_number}
          </span>
          <Badge>{lecture.session_code}</Badge>
          <Badge tone={statusTone(lecture.status)}>{lecture.status}</Badge>
          <Badge>{lecture.instruction_mode}</Badge>
          {lecture.online_only && <Badge>Online Only</Badge>}
        </div>
        <button
          onClick={() => onNotify(sectionType, lecture.section_number)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Notify me
        </button>
      </div>

      {lecture.subcourse_title && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="font-medium text-red-900">
            {lecture.subcourse_title}
          </div>
          {lecture.subcourse_description && (
            <div className="text-sm text-red-800 mt-1">
              {lecture.subcourse_description}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 space-y-3">
        <ProfRow
          profs={lecture.professors}
          emails={lecture.professor_emails}
          gpas={lecture.instructor_gpas}
          rmp={lecture.rmp_ratings}
        />
        <SeatsRow
          capacity={lecture.capacity}
          open={lecture.open_seats}
          waitlist={lecture.waitlist_spots}
        />
        <div className="mt-2">
          <Meetings items={lecture.meetings} onlineOnly={lecture.online_only} />
        </div>
      </div>
    </div>
  );
}

function mapSectionType(t?: string): SectionNotifyType {
  const up = (t || "").toUpperCase();
  if (up === "LEC") return "lecture";
  if (up === "DIS") return "discussion";
  if (up === "LAB") return "lab";
  return "lecture";
}

export function SectionsView({ courseId }: { courseId: number }) {
  const { data, loading, error } = useSections(courseId);

  const handleNotify = async (
    sectionType: SectionNotifyType,
    sectionNumber: string | null
  ) => {
    const result = await createNotificationRequest({
      courseId,
      sectionType,
      sectionNumber,
      desiredSeats: 1,
      wantsWaitlist: false,
    });
    if (result.created) {
      alert("You’ll be notified when seats open.");
    } else {
      alert("You’re already signed up.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-700">
        <LoadingSpinner />
        Loading sections…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-700">
        Failed to load sections: {error.message}
      </div>
    );
  }

  if (!data || !data.sections || data.sections.length === 0) {
    return (
      <div className="text-gray-700">
        <p className="mb-2">
          No Fall 2025 sections are currently available for this course.
        </p>
        <button
          onClick={() => handleNotify("course", null)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Notify me for any section
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">Course GPA</span>
        </div>
        <div className="text-xl font-bold text-black">
          {data.course_avg_gpa !== null ? data.course_avg_gpa.toFixed(2) : "—"}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleNotify("course", null)}
          className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm"
        >
          Notify me for any section
        </button>
      </div>

      {data.sections.map((group, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <SectionBlock
            lecture={group.lecture}
            sectionType={mapSectionType(group.lecture.type)}
            onNotify={handleNotify}
            label={group.lecture.type || "Lecture"}
          />

          {!!group.discussions?.length && (
            <div className="pl-4 border-l-2 border-gray-200 space-y-3">
              {group.discussions.map((dis, i) => (
                <SectionBlock
                  key={`dis-${i}`}
                  lecture={dis}
                  sectionType={"discussion"}
                  onNotify={handleNotify}
                  label={dis.type || "DIS"}
                />
              ))}
            </div>
          )}

          {!!group.labs?.length && (
            <div className="pl-4 border-l-2 border-gray-200 space-y-3">
              {group.labs.map((lab, i) => (
                <SectionBlock
                  key={`lab-${i}`}
                  lecture={lab}
                  sectionType={"lab"}
                  onNotify={handleNotify}
                  label={lab.type || "LAB"}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
