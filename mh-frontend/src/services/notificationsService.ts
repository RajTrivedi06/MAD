import { supabase } from "@/lib/supabase/client";

export type SectionNotifyType = "lecture" | "discussion" | "lab" | "course";

export type CreateNotificationResult = {
  created: boolean; // true if a new row was inserted; false if it already existed
};

export async function createNotificationRequest(opts: {
  courseId: number;
  sectionType: SectionNotifyType;
  sectionNumber: string | null;
  desiredSeats?: number;
  wantsWaitlist?: boolean;
}): Promise<CreateNotificationResult> {
  const {
    courseId,
    sectionType,
    sectionNumber,
    desiredSeats = 1,
    wantsWaitlist = false,
  } = opts;

  const { data: sessionRes, error: sessionErr } =
    await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  const userId = sessionRes.session?.user?.id;
  if (!userId)
    throw new Error("You must be logged in to create notifications.");

  // Check for existing identical request so we can show a precise message
  // Note: Supabase JS v2 doesn't expose onConflict/ignore in typings across all contexts reliably,
  // so we do a pre-check and then a best-effort insert.
  // For NULL section_number, use .is('section_number', null).
  const baseMatch = supabase
    .from("notification_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("section_type", sectionType)
    .eq("desired_seats", desiredSeats)
    .eq("wants_waitlist", wantsWaitlist);

  const { count, error: checkError } =
    sectionNumber === null
      ? await baseMatch.is("section_number", null)
      : await baseMatch.eq("section_number", sectionNumber);

  if (checkError) throw checkError;
  if ((count ?? 0) > 0) {
    return { created: false };
  }

  const { error } = await supabase.from("notification_requests").insert({
    user_id: userId,
    course_id: courseId,
    section_type: sectionType,
    section_number: sectionNumber,
    desired_seats: desiredSeats,
    wants_waitlist: wantsWaitlist,
  });

  if (error) throw error;
  return { created: true };
}
