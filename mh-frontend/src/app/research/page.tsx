"use client";

import { withAuth } from "@/contexts/AuthContext";
import ModernNavigation from "@/components/layout/ModernNavigation";
import ModernRAMatching from "@/components/research/ModernRAMatching";

function ResearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <ModernNavigation />
      <main>
        <ModernRAMatching />
      </main>
    </div>
  );
}

export default withAuth(ResearchPage);
