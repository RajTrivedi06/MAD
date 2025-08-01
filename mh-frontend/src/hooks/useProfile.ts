import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, updateProfile, type Profile } from "@/lib/supabase/auth";

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateUserProfile: (updates: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { profile: profileData, error: profileError } = await getProfile(
        user.id
      );

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setError("Failed to load profile");
        return;
      }

      setProfile(profileData);
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateUserProfile = useCallback(
    async (updates: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
    }): Promise<boolean> => {
      if (!user) return false;

      try {
        setError(null);

        const { profile: updatedProfile, error: updateError } =
          await updateProfile(user.id, updates);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          setError("Failed to update profile");
          return false;
        }

        setProfile(updatedProfile);
        return true;
      } catch (err) {
        console.error("Unexpected error updating profile:", err);
        setError("An unexpected error occurred");
        return false;
      }
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updateUserProfile,
    refreshProfile,
  };
}
