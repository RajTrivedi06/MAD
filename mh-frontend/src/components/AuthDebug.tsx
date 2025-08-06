"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function AuthDebug() {
  const { user, session, loading } = useAuth();
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(
    null
  );
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);
  const [environmentCheck, setEnvironmentCheck] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
  });

  useEffect(() => {
    // Get direct Supabase session
    supabase.auth.getSession().then(({ data }) => {
      setSupabaseSession(data.session);
    });

    // Check localStorage for token and all Supabase keys
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sb-supabase-auth-token");
      setLocalStorageToken(token);

      // Get all Supabase-related localStorage keys
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("supabase")) {
          keys.push(key);
        }
      }
      setLocalStorageKeys(keys);
    }
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black text-white rounded-lg text-xs max-w-sm z-50 border border-gray-600">
      <h3 className="font-bold mb-2 text-red-400">🔍 Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? "⏳" : "✅"}</div>
        <div>User ID: {user?.id || "None"}</div>
        <div>Email: {user?.email || "None"}</div>
        <div>Session: {session ? "✅" : "❌"}</div>
        <div>Direct Session: {supabaseSession ? "✅" : "❌"}</div>
        <div>Provider: {session?.user?.app_metadata?.provider || "None"}</div>
        <div>LocalStorage Token: {localStorageToken ? "✅" : "❌"}</div>
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div>Env URL: {environmentCheck.url}</div>
          <div>Env Key: {environmentCheck.key}</div>
        </div>
        {localStorageKeys.length > 0 && (
          <div className="border-t border-gray-600 pt-1 mt-2">
            <div className="font-semibold">LocalStorage Keys:</div>
            {localStorageKeys.map((key, index) => (
              <div key={index} className="text-xs opacity-75">
                {key}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
