"use client";

import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GridBackground } from "@/components/ui/backgrounds";

export function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.navigate({ to: "/login" });
          return;
        }

        if (data?.session) {
          // Successfully authenticated, redirect to home or intended page
          router.navigate({ to: "/" });
        } else {
          // No session found, redirect to login
          router.navigate({ to: "/login" });
        }
      } catch (error) {
        console.error("Unexpected auth callback error:", error);
        router.navigate({ to: "/login" });
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      <GridBackground />
      <div className="relative z-10 text-center space-y-4">
        <LoadingSpinner />
        <div className="text-white">
          <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
          <p className="text-gray-400">
            Please wait while we process your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
