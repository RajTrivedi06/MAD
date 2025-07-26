"use client";

import { useAuth } from "@/contexts/AuthContext";
import { withAuth } from "@/contexts/AuthContext";
import ModernNavigation from "@/components/layout/ModernNavigation";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <ModernNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.user_metadata?.first_name || "Student"}!
            </h1>
            <p className="text-gray-300 mt-2">
              Your academic dashboard is ready to help you succeed.
            </p>
          </div>
          <DashboardOverview />
        </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
