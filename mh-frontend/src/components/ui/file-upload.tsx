"use client";

import { cn } from "@/lib/utils";
import { IconFileUpload } from "@tabler/icons-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { GridPattern } from "./GridPattern";

export const FileUpload = ({
  onChange,
  className,
}: {
  onChange: (files: File[]) => void;
  className?: string;
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onChange(acceptedFiles);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full rounded-xl p-6 border",
        className
      )}
    >
      <GridPattern
        width={20}
        height={20}
        className="absolute inset-0 stroke-gray-400/10 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
      />
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full">
          <IconFileUpload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {isDragActive ? "Drop your resume here" : "Drag your PDF resume"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            We&apos;ll show a sample ranking in seconds
          </p>
        </div>
      </div>
    </div>
  );
};
