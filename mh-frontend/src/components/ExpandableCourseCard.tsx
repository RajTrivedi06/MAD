"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CourseWithRequirements } from "@/types/course.types";
import { useOutsideClick } from "@/hooks/use-outside-click";

type ExpandableCourseCardProps = {
  course: CourseWithRequirements;
};

export function ExpandableCourseCard({ course }: ExpandableCourseCardProps) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null!);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) =>
      e.key === "Escape" && setActive(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useOutsideClick(ref, () => setActive(false));

  const title = course.title ?? "Untitled";
  const code = course.course_code ?? `Course ${course.course_id}`;
  const description = course.description ?? "No description available.";

  // Prevent body scroll when modal open
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 h-full w-full z-[9999]"
            onClick={() => setActive(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal Card */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[10000] p-3">
            <motion.button
              key={`button-${code}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-4 right-4 lg:hidden items-center justify-center bg-white rounded-full h-8 w-8 shadow"
              onClick={() => setActive(false)}
              aria-label="Close details"
            >
              <CloseIcon />
            </motion.button>

            <motion.div
              layoutId={`card-${code}-${id}`}
              ref={ref}
              className="w-full max-w-[720px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white sm:rounded-3xl overflow-hidden border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b">
                <motion.h3
                  layoutId={`title-${code}-${id}`}
                  className="font-bold text-neutral-900 text-lg"
                >
                  {code}
                </motion.h3>
                <motion.p
                  layoutId={`description-${code}-${id}`}
                  className="text-neutral-700 mt-1"
                >
                  {title}
                </motion.p>
              </div>

              <div className="px-5 pb-5 pt-4 space-y-4 text-sm text-neutral-800 overflow-auto">
                <section>
                  <div className="font-semibold">Description</div>
                  <div className="text-neutral-700 mt-1">{description}</div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <Info label="Credits" value={course.credits ?? "—"} />
                  <Info label="Level" value={course.level ?? "—"} />
                  <Info label="College" value={course.college ?? "—"} />
                  <Info
                    label="Last taught"
                    value={course.last_taught_term ?? "—"}
                  />
                </section>

                {!!course.course_requirements?.breadth_or?.length && (
                  <section>
                    <div className="font-semibold">Breadth</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {course.course_requirements.breadth_or.map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {!!course.course_requirements?.gened_and?.length && (
                  <section>
                    <div className="font-semibold">Gen Ed</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {course.course_requirements.gened_and.map((g, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {course.pre_requisites && (
                  <section>
                    <div className="font-semibold">Prerequisites</div>
                    <div className="text-neutral-700 mt-1">
                      {course.pre_requisites}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Compact Card (grid item) */}
      <motion.div
        layoutId={`card-${code}-${id}`}
        onClick={() => setActive(true)}
        className="p-4 flex flex-col hover:bg-neutral-50 rounded-xl cursor-pointer border bg-white"
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && setActive(true)
        }
        aria-label={`Open details for ${code}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <motion.h3
              layoutId={`title-${code}-${id}`}
              className="font-semibold text-neutral-900"
            >
              {code}
            </motion.h3>
            <motion.p
              layoutId={`description-${code}-${id}`}
              className="text-neutral-700"
            >
              {title}
            </motion.p>
          </div>
          <motion.button
            layoutId={`button-${code}-${id}`}
            className="px-3 py-1.5 text-xs rounded-full font-bold bg-gray-100"
          >
            Details
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-neutral-700">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export const CloseIcon = () => (
  <motion.svg
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.05 } }}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-black"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </motion.svg>
);
