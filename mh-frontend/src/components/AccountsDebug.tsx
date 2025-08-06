"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, createProfile } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

export function AccountsDebug() {
  const { user, loading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const gatherDebugInfo = async () => {
      let info = `=== ACCOUNTS DEBUG INFO ===\n`;
      info += `Timestamp: ${new Date().toISOString()}\n\n`;

      // Auth info
      info += `AUTH:\n`;
      info += `User: ${user ? "Present" : "Not present"}\n`;
      info += `Auth Loading: ${authLoading}\n`;
      if (user) {
        info += `User ID: ${user.id}\n`;
        info += `Email: ${user.email}\n`;
        info += `Email Confirmed: ${user.email_confirmed_at ? "Yes" : "No"}\n`;
      }
      info += `\n`;

      // Supabase config
      info += `SUPABASE:\n`;
      info += `URL: ${
        process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"
      }\n`;
      info += `Anon Key: ${
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"
      }\n`;

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        info += `Session: ${sessionData.session ? "Present" : "Not present"}\n`;
        if (sessionError) {
          info += `Session Error: ${sessionError.message}\n`;
        }
      } catch (err) {
        info += `Session Error: ${
          err instanceof Error ? err.message : "Unknown"
        }\n`;
      }
      info += `\n`;

      // Profile test
      if (user) {
        info += `PROFILE TEST:\n`;
        let profileExists = false;
        let profileErrorCode = "";

        try {
          const { profile, error: profileError } = await getProfile(user.id);
          profileExists = !!profile;
          profileErrorCode = profileError?.code || "";

          info += `Profile Exists: ${profile ? "Yes" : "No"}\n`;
          if (profileError) {
            info += `Profile Error: ${profileError.message}\n`;
            info += `Error Code: ${profileError.code}\n`;
            if (profileError.code === "PGRST116") {
              info += `→ This means profile doesn't exist (needs creation)\n`;
            }
          }
          if (profile) {
            info += `Profile Email: ${profile.email}\n`;
            info += `Profile Name: ${profile.first_name} ${profile.last_name}\n`;
            info += `Has Summary: ${profile.profile_summary ? "Yes" : "No"}\n`;
          }
        } catch (err) {
          info += `Profile Error: ${
            err instanceof Error ? err.message : "Unknown"
          }\n`;
        }

        // Test profile creation if profile doesn't exist
        if (!profileExists && profileErrorCode === "PGRST116") {
          info += `PROFILE CREATION TEST:\n`;
          try {
            const { profile: newProfile, error: createError } =
              await createProfile(
                user.id,
                user.email!,
                user.user_metadata?.first_name,
                user.user_metadata?.last_name
              );
            info += `Profile Creation: ${createError ? "Failed" : "Success"}\n`;
            if (createError) {
              info += `Creation Error: ${createError.message}\n`;
            } else {
              info += `New Profile ID: ${newProfile?.id}\n`;
            }
          } catch (err) {
            info += `Creation Error: ${
              err instanceof Error ? err.message : "Unknown"
            }\n`;
          }
          info += `\n`;
        }

        info += `\n`;

        // Direct query test
        info += `DIRECT QUERY TEST:\n`;
        try {
          const { data: directData, error: directError } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("id", user.id)
            .single();

          info += `Direct Query Success: ${!directError}\n`;
          if (directError) {
            info += `Direct Query Error: ${directError.message}\n`;
          }
          if (directData) {
            info += `Direct Query Data: ${JSON.stringify(directData)}\n`;
          }
        } catch (err) {
          info += `Direct Query Error: ${
            err instanceof Error ? err.message : "Unknown"
          }\n`;
        }
      }

      // Network info
      info += `\nNETWORK:\n`;
      info += `Online: ${navigator.onLine}\n`;
      info += `User Agent: ${navigator.userAgent.substring(0, 100)}...\n`;

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [user, authLoading]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug Accounts
      </button>
    );
  }

  return (
    <div className="fixed inset-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Accounts Page Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto whitespace-pre-wrap">
        {debugInfo}
      </pre>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
        >
          Refresh Page
        </button>
        <button
          onClick={() => {
            setDebugInfo("Refreshing...");
            setTimeout(() => {
              const event = new Event("debug-refresh");
              window.dispatchEvent(event);
            }, 100);
          }}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs"
        >
          Refresh Debug Info
        </button>
      </div>
    </div>
  );
}
