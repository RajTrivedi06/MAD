"use client";

import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";

export const ResumeDrop = () => {
  const handleFileChange = (files: File[]) => {
    console.log("Files uploaded:", files);
    // Here you would typically handle the file upload
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Try It Now
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Drop your PDF resume and see how our AI matches you with perfect
            courses and research opportunities.
          </p>
        </div>
        <Card className="w-full max-w-xl mx-auto p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Try it now – drop your PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag your PDF resume – we&apos;ll show a sample ranking in
              seconds.
            </p>
          </div>
          <FileUpload onChange={handleFileChange} />
        </Card>
      </div>
    </section>
  );
};
