"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type ExtendedDatabase = Database & {
  public: {
    Tables: Database["public"]["Tables"] & {
      profiles: {
        Row: Database["public"]["Tables"]["profiles"]["Row"] & {
          in_progress_course_ids: number[] | null;
        };
        Insert: Database["public"]["Tables"]["profiles"]["Insert"] & {
          in_progress_course_ids?: number[] | null;
        };
        Update: Database["public"]["Tables"]["profiles"]["Update"] & {
          in_progress_course_ids?: number[] | null;
        };
      };
      study_group_requests: {
        Row: {
          profile_id: string;
          course_id: number;
          message: string | null;
          created_at?: string;
        };
        Insert: {
          profile_id: string;
          course_id: number;
          message?: string | null;
        };
        Update: {
          profile_id?: string;
          course_id?: number;
          message?: string | null;
        };
      };
    };
  };
};

const db = supabase as SupabaseClient<ExtendedDatabase>;

type Course = {
  course_id: number;
  course_code: string | null;
  title: string | null;
  credits: number | string | null;
  level: string | null;
  college: string | null;
  last_taught_term: string | null;
};

type ProfileRow = {
  id: string;
  in_progress_course_ids: number[] | null;
  full_name: string | null;
  email: string | null;
};

export function StudyGroupPage() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  type RequestRow =
    ExtendedDatabase["public"]["Tables"]["study_group_requests"]["Row"];
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthChecking(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      setAuthChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profData, error: profErr } = await db
          .from("profiles")
          .select("id, in_progress_course_ids, full_name, email")
          .eq("id", userId)
          .maybeSingle<ProfileRow>();

        if (profErr) throw profErr;
        if (!profData) {
          setProfile(null);
          setCourses([]);
          setLoading(false);
          return;
        }

        setProfile(profData);

        const ids = profData.in_progress_course_ids ?? [];
        if (ids.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        const { data: courseData, error: courseErr } = await db
          .from("courses")
          .select(
            "course_id, course_code, title, credits, level, college, last_taught_term"
          )
          .in("course_id", ids)
          .order("course_code", { ascending: true })
          .returns<Course[]>();

        if (courseErr) throw courseErr;
        setCourses(courseData ?? []);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong loading your courses.";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Load user's existing study group requests
  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    (async () => {
      try {
        setRequestsLoading(true);
        setRequestsError(null);
        const { data, error: reqErr } = await db
          .from("study_group_requests")
          .select("profile_id, course_id, message, created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false });
        if (reqErr) throw reqErr;
        if (!mounted) return;
        setRequests(data ?? []);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load your study group requests.";
        setRequestsError(message);
      } finally {
        if (mounted) setRequestsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleOpenDialog = (course: Course) => {
    setActiveCourse(course);
    setNote("");
    setSubmitMsg(null);
    setDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!userId || !activeCourse) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const { data: inserted, error: insertErr } = await db
        .from("study_group_requests")
        .insert({
          profile_id: userId,
          course_id: activeCourse.course_id,
          message: note?.trim() || null,
        })
        .select("profile_id, course_id, message, created_at")
        .single();

      if (insertErr) throw insertErr;
      setSubmitMsg("Request sent! We'll notify matching classmates.");
      if (inserted) {
        setRequests((prev) => [inserted, ...prev]);
      } else {
        // optimistic fallback
        setRequests((prev) => [
          {
            profile_id: userId,
            course_id: activeCourse.course_id,
            message: note?.trim() || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setTimeout(() => setDialogOpen(false), 900);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create request. Please try again.";
      setSubmitMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasCourses = useMemo(() => (courses?.length ?? 0) > 0, [courses]);
  const courseMap = useMemo(() => {
    const map = new Map<number, Course>();
    for (const c of courses) map.set(c.course_id, c);
    return map;
  }, [courses]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
            <p className="mt-2 text-gray-600">
              Find classmates from your current courses and coordinate study
              sessions.
            </p>
          </div>
          {/* Removed the disabled Create Group button */}
        </div>

        {/* Auth / loading / error */}
        {authChecking ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your session…
          </div>
        ) : !userId ? (
          <div className="rounded-lg border bg-white p-4 text-gray-700">
            Please sign in to see your in-progress courses and request study
            buddies.
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Your Courses */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  In-progress courses
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your
                  courses…
                </div>
              ) : !hasCourses ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    No in-progress courses found
                  </h3>
                  <p className="text-sm text-gray-600">
                    We didn’t find any entries in your profile’s{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      in_progress_course_ids
                    </code>
                    .
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((c, i) => (
                    <motion.li
                      key={c.course_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {c.course_code ?? `Course ${c.course_id}`}
                            </p>
                            {c.level ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {c.level}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-700 line-clamp-2">
                            {c.title ?? "Untitled course"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            {c.credits != null && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {String(c.credits)} cr
                              </span>
                            )}
                            {c.last_taught_term && (
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Last taught: {c.last_taught_term}
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <button
                              onClick={() => handleOpenDialog(c)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Find me study buddies
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Status
              </h2>
              <div className="space-y-3">
                {requestsLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading your
                    requests…
                  </div>
                ) : requestsError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {requestsError}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-sm text-gray-600">No requests yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                    {requests.map((r, idx) => {
                      const c = courseMap.get(r.course_id);
                      return (
                        <li
                          key={`${r.course_id}-${r.created_at}-${idx}`}
                          className="p-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {c?.course_code ?? `Course ${r.course_id}`}
                              </p>
                              {r.message && (
                                <p className="mt-0.5 text-gray-700 line-clamp-2">
                                  {r.message}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleString()
                                : ""}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Right: Profile summary */}
          <aside className="space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Your account
              </h3>
              <p className="text-sm text-gray-700">
                {profile?.full_name ?? "—"}
                <br />
                <span className="text-gray-500">{profile?.email ?? ""}</span>
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Dialog */}
      {dialogOpen && activeCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !submitting && setDialogOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Find study buddies for{" "}
              {activeCourse.course_code ?? activeCourse.course_id}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Add a short note (optional). This will be saved with your request.
            </p>
            <textarea
              className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="e.g., I’m free Tue/Thu evenings; prefer on-campus library."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
            />
            {submitMsg && (
              <div className="mt-2 text-sm">
                <span
                  className={
                    submitMsg.startsWith("Request sent")
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {submitMsg}
                </span>
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 disabled:opacity-60"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
