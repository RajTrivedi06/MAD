export type RmpRating = {
  avg_rating: number | null;
  avg_difficulty: number | null;
  num_ratings: number | null;
  would_take_again_percent: number | null;
};

export type Meeting = {
  days: string; // "" for online/asynchronous
  start: string | null; // "HH:MM" or null
  end: string | null; // "HH:MM" or null
  location: string | null;
  map_url?: string | null;
  av_url?: string | null;
};

export type InstructorGpas = Record<string, number | null>;
export type RmpRatings = Record<string, RmpRating>;

export type LectureFields = {
  section_number: string;
  session_code: string; // e.g. "FALL2025" or "A1" (we'll still filter)
  type: string; // "LEC" | "DIS" | "LAB" | etc.
  status: string; // "OPEN" | "WAITLISTED" | "CLOSED" | etc.
  instruction_mode: string;
  online_only: boolean;
  professors: string[];
  professor_emails: string[];
  capacity: number | null;
  open_seats: number | null;
  waitlist_spots: number | null;
  meetings: Meeting[];
  subcourse_title?: string | null; // topics courses
  subcourse_description?: string | null; // topics courses
  instructor_gpas?: InstructorGpas;
  rmp_ratings?: RmpRatings; // subject to change as per spec
};

export type SectionGroup = {
  lecture: LectureFields;
  discussions?: LectureFields[];
  labs?: LectureFields[];
};

export type SectionsResponse = {
  course_avg_gpa: number | null;
  sections: SectionGroup[];
};
