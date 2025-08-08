import React, { useCallback, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AnimatePresence, motion } from "framer-motion";
import type { Database } from "@/lib/supabase/database.types";

/** ---------------- Types ---------------- */

type Link = { label: string; url: string };

type LabJson = {
  labName: string;
  professor: {
    name: string;
    contactEmail: string;
    department: string;
    departmentContactEmail: string;
    profileLinks: Link[];
  };
  researchSummaryProfessor: string;
  researchSummaryProfessorLinks: Link[];
  researchInterestsProfessor: string[];
  latestNews: string;
  latestNewsLinks: Link[];
  labResearchSummary: string;
  labResearchSummaryLinks: Link[];
  similarStudiesElsewhere: string[];
  similarStudiesElsewhereLinks: Link[];
  suggestedRAQualifications: string[];
  interviewPrepResources: string[];
  interviewPrepResourcesLinks: Link[];
};

type LabHit = {
  lab_id: number;
  url: string;
  similarity: number; // not shown in UI
  lab?: LabJson;
};

type RecommendRequest = {
  interest?: string;
  top_n?: number;
};

/** ---------------- Config ---------------- */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const RECOMMEND_PATH = "/api/labs/recommend";
const DEFAULT_TOP_N = 10;

/** ---------------- Helpers ---------------- */

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

// Remove control chars, :contentReference[...] artifacts, & tighten whitespace
function sanitize(text?: string) {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/:contentReference\[[^\]]*?\]\{[^}]*?\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Break long blurbs into readable paragraphs (period-based heuristic)
function toParagraphs(text: string): string[] {
  const s = sanitize(text);
  if (!s) return [];
  return s
    .split(/(?<=[.?!])\s+(?=[A-Z(])/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Extract (1) ...; (2) ...; (3) ... items into an array
function extractEnumeratedItems(text: string): string[] {
  const s = sanitize(text);
  const items: string[] = [];
  const regex = /\(\d+\)\s*([^;]+)(?:;|\s*$)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(s)) !== null) items.push(m[1].trim());
  return items;
}

// Safely escape HTML and apply bold formatting for *text* and **text**
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function applyInlineEmphasis(text?: string): string {
  if (!text) return "";
  const s = sanitize(text);
  const escaped = escapeHtml(s);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>");
}

// Minimize the lab object for email generation to reduce payload/latency
type MinimalLab = {
  labName?: string;
  professor?: { name?: string; contactEmail?: string; department?: string };
  labResearchSummary?: string;
  researchInterestsProfessor?: string[];
  suggestedRAQualifications?: string[];
  latestNews?: string;
};

function toMinimalLab(lab?: LabJson | null): MinimalLab {
  if (!lab) return {};
  return {
    labName: sanitize(lab.labName),
    professor: {
      name: sanitize(lab.professor?.name),
      contactEmail: sanitize(lab.professor?.contactEmail),
      department: sanitize(lab.professor?.department),
    },
    labResearchSummary: sanitize(
      lab.labResearchSummary || lab.researchSummaryProfessor
    ),
    researchInterestsProfessor: lab.researchInterestsProfessor
      ?.slice(0, 16)
      .map(sanitize),
    suggestedRAQualifications: lab.suggestedRAQualifications
      ?.slice(0, 10)
      .map(sanitize),
    latestNews: sanitize(lab.latestNews),
  };
}

type ProfileSummary =
  Database["public"]["Tables"]["profiles"]["Row"]["profile_summary"];

// Convert the structured profile summary into a concise text for the LLM
function summarizeProfileSummary(profileSummary: ProfileSummary): string {
  if (!profileSummary) return "";
  try {
    const ap = profileSummary.academic_profile;
    const te = profileSummary.technical_expertise;
    const as = profileSummary.academic_strengths;
    const ri = profileSummary.research_interests as string[] | undefined;
    const up = profileSummary.unique_value_proposition;
    const ideal = profileSummary.ideal_research_areas as string[] | undefined;

    const lines: string[] = [];
    if (ap) {
      lines.push(
        `Academic: Major=${ap.major}, Grad=${ap.expected_graduation}, GPA=${ap.gpa}`
      );
    }
    if (te) {
      const pl = te.programming_languages || {};
      const ft = te.frameworks_tools || {};
      const spec = te.specialized_skills || [];
      lines.push(
        `Skills: Proficient=${(pl.proficient || []).join(", ")}; Familiar=${(
          pl.familiar || []
        ).join(", ")}`
      );
      const ftAll = [
        ...(ft.frontend || []),
        ...(ft.backend || []),
        ...(ft.data_science || []),
        ...(ft.development || []),
      ];
      if (ftAll.length) lines.push(`Tools: ${ftAll.join(", ")}`);
      if (spec.length) lines.push(`Specialized: ${spec.join(", ")}`);
    }
    if (as?.core_competencies?.length)
      lines.push(`Competencies: ${as.core_competencies.join(", ")}`);
    if (as?.coursework_highlights) {
      const ch = as.coursework_highlights;
      const arr = [
        ...(ch.advanced_cs || []),
        ...(ch.machine_learning || []),
        ...(ch.data_science || []),
        ...(ch.interdisciplinary || []),
      ];
      if (arr.length) lines.push(`Coursework: ${arr.join(", ")}`);
    }
    if (ri?.length) lines.push(`Research interests: ${ri.join(", ")}`);
    if (up) lines.push(`Value: ${up}`);
    if (ideal?.length) lines.push(`Ideal areas: ${ideal.join(", ")}`);
    return lines.join("\n");
  } catch {
    return typeof profileSummary === "string"
      ? profileSummary
      : JSON.stringify(profileSummary);
  }
}

/** ---------------- UI Atoms ---------------- */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-900 border border-gray-300 px-2.5 py-0.5 text-[11px]">
      {children}
    </span>
  );
}

function LinkList({
  items,
  emptyDash = true,
}: {
  items?: Link[];
  emptyDash?: boolean;
}) {
  const list = items ?? [];
  if (!list.length && emptyDash)
    return <p className="text-sm text-gray-900">—</p>;
  return (
    <ul className="space-y-1">
      {list.map((l, i) => (
        <li key={`${l.url}-${i}`}>
          <a
            className="text-red-600 hover:underline break-words"
            href={l.url}
            target="_blank"
            rel="noreferrer"
          >
            {sanitize(l.label)}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cx(
        "h-5 w-5 transition-transform duration-200",
        open ? "rotate-180" : "rotate-0"
      )}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** ---------------- Lab Focus (clean formatter) ---------------- */

function LabFocus({ lab }: { lab?: LabJson }) {
  const raw =
    lab?.labResearchSummary?.trim() ||
    lab?.researchSummaryProfessor?.trim() ||
    "";
  const paragraphs = toParagraphs(raw);
  const enumerated = extractEnumeratedItems(raw);

  let intro: string | null = null;
  if (enumerated.length) {
    const idx = sanitize(raw).indexOf("(1)");
    intro = idx > 0 ? sanitize(raw).slice(0, idx).trim() : null;
    if (!intro && paragraphs.length) intro = paragraphs[0];
  } else if (paragraphs.length) {
    intro = paragraphs[0];
  }

  return (
    <div className="space-y-3">
      {intro && (
        <p
          className="text-gray-900 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: applyInlineEmphasis(intro) }}
        />
      )}
      {enumerated.length > 0 ? (
        <ol className="list-decimal list-inside space-y-1 text-gray-900">
          {enumerated.map((it, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{ __html: applyInlineEmphasis(it) }}
            />
          ))}
        </ol>
      ) : (
        paragraphs
          .slice(1)
          .map((p, i) => (
            <p
              key={i}
              className="text-gray-900 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: applyInlineEmphasis(p) }}
            />
          ))
      )}
    </div>
  );
}

/** ---------------- Expandable Card (no funding, no match %) ---------------- */

function LabCard({
  hit,
  profileSummary,
}: {
  hit: LabHit;
  profileSummary: ProfileSummary;
}) {
  const [open, setOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const lab = hit.lab;

  const title = sanitize(lab?.labName) || "Research Lab";
  const subtitleLeft = sanitize(lab?.professor?.name) || "";
  const subtitleRight = lab?.professor?.department
    ? sanitize(lab.professor.department)
    : "";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md">
      <ShineBorder shineColor="#dc2626" borderWidth={2} duration={12} />
      {/* Collapsed header */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 rounded-t-2xl bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 flex flex-col gap-1"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] sm:text-lg font-extrabold text-black">
            {title}
            {lab?.professor?.department ? (
              <span className="font-semibold text-gray-900">{` (${sanitize(
                lab.professor.department
              )})`}</span>
            ) : null}
          </h3>
          <span className="text-gray-900">
            <Chevron open={open} />
          </span>
        </div>

        {(subtitleLeft || subtitleRight) && (
          <p className="text-sm text-gray-900">
            {subtitleLeft}
            {subtitleRight ? <> • {subtitleRight}</> : null}
          </p>
        )}
      </button>

      {/* Expanded body with animation */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 pt-0 border-t border-gray-200 overflow-hidden"
          >
            <div className="h-px bg-gray-200 mb-6" />

            {/* Lab Focus */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900">Lab Focus</h4>
              <div className="mt-2">
                <LabFocus lab={lab} />
              </div>
            </div>

            {/* Keywords */}
            {(lab?.researchInterestsProfessor?.length ?? 0) > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900">
                  Keywords & Interests
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lab!.researchInterestsProfessor.slice(0, 16).map((kw) => (
                    <Pill key={kw}>{sanitize(kw)}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Qualifications */}
            {(lab?.suggestedRAQualifications?.length ?? 0) > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900">
                  Suggested RA Qualifications
                </h4>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-900 space-y-1">
                  {lab!.suggestedRAQualifications.slice(0, 10).map((q, i) => (
                    <li key={i}>{sanitize(q)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Links & News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Professor Links
                </h4>
                <div className="mt-2">
                  <LinkList items={lab?.professor?.profileLinks} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Latest News
                </h4>
                <div className="mt-2">
                  <LinkList items={lab?.latestNewsLinks} />
                </div>
              </div>

              {(lab?.labResearchSummaryLinks?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Research Overview Links
                  </h4>
                  <div className="mt-2">
                    <LinkList items={lab?.labResearchSummaryLinks} />
                  </div>
                </div>
              )}

              {(lab?.similarStudiesElsewhereLinks?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Similar Studies Elsewhere
                  </h4>
                  <div className="mt-2">
                    <LinkList items={lab?.similarStudiesElsewhereLinks} />
                  </div>
                </div>
              )}
            </div>

            {/* Generate Email Template */}
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (!lab) return;
                  try {
                    setEmailLoading(true);
                    setGeneratedEmail(null);
                    const { data: sessionRes } =
                      await supabase.auth.getSession();
                    const userId = sessionRes.session?.user?.id;
                    if (!userId) {
                      alert("Please sign in to generate an email.");
                      return;
                    }
                    // Use pre-fetched profileSummary if available; otherwise fetch once
                    let profileForEmail = profileSummary;
                    if (!profileForEmail) {
                      const { data: profileRow, error } = await supabase
                        .from("profiles")
                        .select("profile_summary")
                        .eq("id", userId)
                        .single();
                      if (error) throw error;
                      profileForEmail =
                        (profileRow?.profile_summary as ProfileSummary) ?? null;
                    }
                    const profileText =
                      summarizeProfileSummary(profileForEmail);
                    const minimalLab = toMinimalLab(lab);
                    const res = await fetch("/api/generate-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        lab: minimalLab,
                        profile: profileText,
                      }),
                    });
                    const json = await res.json();
                    setGeneratedEmail(json.email ?? "");
                  } catch (e) {
                    console.error(e);
                    alert("Failed to generate email template.");
                  } finally {
                    setEmailLoading(false);
                  }
                }}
                disabled={emailLoading}
                className={cx(
                  "inline-flex items-center rounded-lg px-4 py-2 text-white shadow-sm transition",
                  emailLoading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {emailLoading ? "Generating..." : "Generate Email Template"}
              </button>
              <AnimatePresence>
                {generatedEmail && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 rounded-lg border border-gray-300 bg-gray-50 p-3"
                  >
                    <h5 className="text-sm font-semibold text-red-600 mb-2">
                      Generated Email Template
                    </h5>
                    <pre className="whitespace-pre-wrap text-sm text-gray-900">
                      {generatedEmail}
                    </pre>
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(generatedEmail)
                        }
                        className="inline-flex items-center rounded px-3 py-1 text-white bg-black hover:bg-gray-900"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** ---------------- Skeleton ---------------- */

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-300 bg-white shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

/** ---------------- Main Component ---------------- */

export function RAFeature() {
  const [interest, setInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<LabHit[] | null>(null);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>(null);

  const canInterest = useMemo(() => interest.trim().length > 0, [interest]);

  const validateInterest = useCallback(() => {
    if (!interest.trim()) return "Please enter your interests.";
    return null;
  }, [interest]);

  async function fetchLabJsonsIfNeeded(list: LabHit[]): Promise<LabHit[]> {
    const needsFetch = list.some((h) => !h.lab);
    if (!needsFetch) return list;
    const augmented = await Promise.all(
      list.map(async (h) => {
        if (h.lab) return h;
        try {
          const r = await fetch(h.url, { method: "GET" });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const lab = (await r.json()) as LabJson;
          return { ...h, lab };
        } catch {
          return { ...h };
        }
      })
    );
    return augmented;
  }

  const runRecommend = useCallback(async (payload: RecommendRequest) => {
    setError(null);
    setHits(null);
    setLoading(true);
    try {
      const body: RecommendRequest = { ...payload, top_n: DEFAULT_TOP_N };

      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      const res = await fetch(`${BACKEND_URL}${RECOMMEND_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Omit mode: backend infers interest/profile/combined automatically
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as LabHit[];
      const withJson = await fetchLabJsonsIfNeeded(data);
      setHits(withJson);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onMatchByInterest = useCallback(async () => {
    const v = validateInterest();
    if (v) {
      setError(v);
      return;
    }
    await runRecommend({ interest: interest.trim() });
  }, [validateInterest, runRecommend, interest]);

  const onRecommendByProfile = useCallback(async () => {
    await runRecommend({});
  }, [runRecommend]);

  // Prefetch profile summary once for faster email generation
  React.useEffect(() => {
    (async () => {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const userId = sessionRes.session?.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("profile_summary")
          .eq("id", userId)
          .single();
        if (!error)
          setProfileSummary((data?.profile_summary as ProfileSummary) ?? null);
      } catch {
        // ignore prefetch errors
      }
    })();
  }, []);

  /** ---------- Input Panel (new, pretty OR layout) ---------- */
  function OrDivider() {
    return (
      <div className="flex items-center gap-3 my-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-900">
          OR
        </span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>
    );
  }

  function SparkleIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-red-600"
        fill="currentColor"
      >
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 8l.75 2.25L21 13l-2.25.75L18 16l-.75-2.25L15 13l2.25-.75L18 10zM6 14l.6 1.8L9 16.5l-1.8.6L6 19l-.6-1.9L3 16.5l1.9-.7L6 14z" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 shadow-md" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
                Research Assistant Finder
              </h1>
              <p className="text-gray-900">
                Use your interests and profile to discover UW–Madison labs.
              </p>
            </div>
          </div>
        </div>

        {/* Input Panel (enhanced) */}
        <div className="relative mb-8">
          <ShineBorder shineColor="#dc2626" borderWidth={2} duration={18} />
          <div className="rounded-2xl border border-gray-300 bg-white shadow-sm p-6">
            {/* Two-column at md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Interest entry */}
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-black mb-2">
                  Tell us your interests
                </label>
                <textarea
                  rows={5}
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="e.g., Biomaterials, hydrogels for tissue engineering, stem cell engineering, bio-inspired scaffolds…"
                  className="w-full rounded-lg border-gray-400 focus:border-red-600 focus:ring-red-600 text-black placeholder-gray-700"
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={onMatchByInterest}
                    disabled={!canInterest || loading}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-sm transition",
                      !canInterest || loading
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <SparkleIcon />
                    {loading ? "Matching…" : "Find matches by interest"}
                  </button>
                  {error && (
                    <span className="text-sm text-red-700">{error}</span>
                  )}
                </div>
              </div>

              {/* Right: OR + Profile CTA */}
              <div className="flex flex-col">
                <OrDivider />
                <div className="rounded-xl border border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-black/90 text-white flex items-center justify-center">
                      {/* User/profile icon */}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.91-8 6.5V23h16v-2.5c0-3.59-3.582-6.5-8-6.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-black">
                        Or, use my saved profile
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        We&apos;ll read your profile and recommend labs—even if
                        you leave interests blank.
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={onRecommendByProfile}
                          disabled={loading}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-sm transition",
                            loading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-black hover:bg-gray-900"
                          )}
                        >
                          {loading ? "Matching…" : "Based on my profile"}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-900">
                        Tip: Add interests <em>and</em> be signed in to blend
                        both (combined mode).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}

          {!loading && hits?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-400 bg-white p-8 text-center text-gray-900">
              No strong matches yet. Try broadening your interests or check your
              saved profile.
            </div>
          )}

          {!loading &&
            hits?.map((h) => (
              <LabCard
                key={`${h.lab_id}-${h.url}`}
                hit={h}
                profileSummary={profileSummary}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
