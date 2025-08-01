import { supabase } from "./client";
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Get user profile
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return { profile: null, error };
  }

  return { profile: data, error: null };
}

// Update user profile
export async function updateProfile(
  userId: string,
  updates: Database["public"]["Tables"]["profiles"]["Update"]
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { profile: null, error };
  }

  return { profile: data, error: null };
}

// Create user profile (called after successful signup)
export async function createProfile(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return { profile: null, error };
  }

  return { profile: data, error: null };
}

// Check if user is authenticated
export async function isAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session?.user;
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Sign in with OAuth providers
export async function signInWithProvider(provider: "google" | "github") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(`Error signing in with ${provider}:`, error);
    return { error };
  }

  return { data, error: null };
}
