"use client";

import { withAuth } from "@/contexts/AuthContext";
import ModernNavigation from "@/components/layout/ModernNavigation";
import ModernCourseSearchAI from "@/components/search/ModernCourseSearchAI";

function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <ModernNavigation />
      <main>
        <ModernCourseSearchAI />
      </main>
    </div>
  );
}

export default withAuth(SearchPage);
