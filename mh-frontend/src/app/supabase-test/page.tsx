"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const testConnection = async () => {
    setLoading(true);
    setMessage("Testing connection...");

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setMessage(`Connection Error: ${error.message}`);
      } else {
        setMessage("✅ Supabase connection successful!");
      }
    } catch (err) {
      setMessage(`❌ Connection failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignUp = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    setLoading(true);
    setMessage("Signing up...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "http://localhost:3001/auth/callback",
        },
      });

      if (error) {
        setMessage(`❌ Sign up error: ${error.message}`);
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          setMessage(
            "✅ Sign up successful! Please check your email for confirmation."
          );
        } else {
          setMessage("✅ Sign up successful! User created.");
        }
      }
    } catch (err) {
      setMessage(`❌ Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    setLoading(true);
    setMessage("Signing in...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`❌ Sign in error: ${error.message}`);
      } else {
        setMessage("✅ Sign in successful!");
      }
    } catch (err) {
      setMessage(`❌ Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Supabase Connection Test
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Test your Supabase authentication setup
          </p>
        </div>

        <div className="space-y-6">
          {/* Connection Test */}
          <div>
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Test Supabase Connection
            </button>
          </div>

          {/* Email and Password Fields */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={testSignUp}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Test Sign Up
            </button>
            <button
              onClick={testSignIn}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Test Sign In
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className="mt-4 p-4 rounded-md bg-gray-50 border">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Setup Instructions:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Go to Supabase Dashboard → Authentication → Providers</li>
              <li>• Enable Email provider</li>
              <li>• Set Site URL to: http://localhost:3001</li>
              <li>• Add redirect URL: http://localhost:3001/auth/callback</li>
              <li>• Check Email Templates in Authentication settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
