"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Settings,
  Shield,
  Bell,
  FileText,
  LogOut,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProfile,
  updateProfile,
  createProfile,
  type Profile,
} from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

export function AccountsPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    full_name: "",
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  // Document upload functionality
  const {
    darsState,
    cvState,
    documentStatus,
    uploadDocument,
    getDocumentStatus,
  } = useDocumentUpload();

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { profile: profileData, error: profileError } = await getProfile(
        user.id
      );

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 is "Row not found" - we'll handle this case
        console.error("Error loading profile:", profileError);
        setError("Failed to load profile");
        return;
      }

      if (!profileData) {
        // Profile doesn't exist, create it from user metadata
        console.log("No profile found, creating from user metadata:", {
          user_metadata: user.user_metadata,
          email: user.email,
          id: user.id,
        });
        const { profile: newProfile, error: createError } = await createProfile(
          user.id,
          user.email || "",
          user.user_metadata?.first_name,
          user.user_metadata?.last_name
        );

        if (createError) {
          console.error("Error creating profile:", createError);
          setError("Failed to create profile");
          return;
        }

        setProfile(newProfile);
        if (newProfile) {
          setEditedProfile({
            first_name: newProfile.first_name || "",
            last_name: newProfile.last_name || "",
            email: newProfile.email || "",
            full_name: newProfile.full_name || "",
          });
        }
      } else {
        setProfile(profileData);
        setEditedProfile({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          full_name: profileData.full_name || "",
        });
      }
    } catch (err) {
      console.error("Unexpected error loading profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
      getDocumentStatus();
    } else if (!authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, loadProfile, router, getDocumentStatus]);

  // Add profile update listener
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile();
      getDocumentStatus();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [loadProfile, getDocumentStatus]);

  // Initialize editedProfile when user data becomes available
  useEffect(() => {
    if (user && !profile) {
      setEditedProfile({
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
        full_name:
          user.user_metadata?.full_name ||
          (user.user_metadata?.first_name && user.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : ""),
      });
    }
  }, [user, profile]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset to original values
    if (profile) {
      setEditedProfile({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        full_name: profile.full_name || "",
      });
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      setError(null);

      // Update full name based on first and last name
      const fullName =
        editedProfile.first_name && editedProfile.last_name
          ? `${editedProfile.first_name} ${editedProfile.last_name}`
          : editedProfile.first_name || editedProfile.last_name || "";

      const updates = {
        first_name: editedProfile.first_name,
        last_name: editedProfile.last_name,
        full_name: fullName,
        // Note: Email updates typically require special handling and verification
      };

      const { profile: updatedProfile, error: updateError } =
        await updateProfile(user.id, updates);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to update profile");
        return;
      }

      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Document upload handlers
  const handleFileUpload = async (file: File, type: "dars" | "cv") => {
    try {
      const result = await uploadDocument(file, type);
      if (result.success) {
        setNotification({
          type: "success",
          message: `${
            type === "dars" ? "DARS report" : "Resume/CV"
          } uploaded successfully! Your profile has been updated with the processed data.`,
        });
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Upload failed. Please try again.",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred during upload.",
      });
    }
  };

  const handleFileSelect = (type: "dars" | "cv") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file, type);
      }
    };
    input.click();
  };

  const formatDate = (dateString: string) => {
    if (typeof window === "undefined") {
      // Server-side fallback to avoid hydration mismatch
      return new Date(dateString).toISOString().split("T")[0];
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your profile information and account preferences
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <Alert
            className={`mb-6 ${
              notification.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                notification.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 hover:text-red-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Preferences</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 hover:text-red-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 hover:text-red-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 hover:text-red-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>DARS Reports</span>
                </div>
                <div className="border-t pt-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 text-red-600 hover:text-red-700 cursor-pointer p-3 rounded-lg hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {profile?.first_name?.[0] ||
                        user?.user_metadata?.first_name?.[0] ||
                        profile?.email?.[0] ||
                        user?.email?.[0] ||
                        "U"}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.full_name ||
                        (user?.user_metadata?.first_name &&
                        user?.user_metadata?.last_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                          : user?.email?.split("@")[0] || "User")}
                    </h2>
                    <p className="text-gray-600">
                      {profile?.email || user?.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Member since{" "}
                      {profile?.created_at
                        ? formatDate(profile.created_at)
                        : user?.created_at
                        ? formatDate(user.created_at)
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.first_name}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {profile?.first_name ||
                            user?.user_metadata?.first_name ||
                            "Not set"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.last_name}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {profile?.last_name ||
                            user?.user_metadata?.last_name ||
                            "Not set"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {profile?.email || user?.email}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your email address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Created
                        </span>
                        <p className="text-xs text-gray-500">
                          {profile?.created_at
                            ? formatDate(profile.created_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Last Updated
                        </span>
                        <p className="text-xs text-gray-500">
                          {profile?.updated_at
                            ? formatDate(profile.updated_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex items-center space-x-4 pt-6 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Information Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Document Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">DARS Report</span>
                    <div className="flex items-center space-x-2">
                      {documentStatus.darsStatus === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {darsState.isUploading && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          documentStatus.darsStatus === "completed"
                            ? "text-green-600"
                            : documentStatus.darsStatus === "processing"
                            ? "text-yellow-600"
                            : "text-gray-400"
                        }`}
                      >
                        {documentStatus.darsStatus === "completed"
                          ? "Uploaded"
                          : documentStatus.darsStatus === "processing"
                          ? "Processing"
                          : darsState.isUploading
                          ? "Uploading..."
                          : "Not uploaded"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resume/CV</span>
                    <div className="flex items-center space-x-2">
                      {documentStatus.cvStatus === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {cvState.isUploading && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          documentStatus.cvStatus === "completed"
                            ? "text-green-600"
                            : documentStatus.cvStatus === "processing"
                            ? "text-yellow-600"
                            : "text-gray-400"
                        }`}
                      >
                        {documentStatus.cvStatus === "completed"
                          ? "Uploaded"
                          : documentStatus.cvStatus === "processing"
                          ? "Processing"
                          : cvState.isUploading
                          ? "Uploading..."
                          : "Not uploaded"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {documentStatus.lastUpdated.dars ||
                      documentStatus.lastUpdated.cv
                        ? formatDate(
                            (documentStatus.lastUpdated.dars ||
                              documentStatus.lastUpdated.cv)!.toISOString()
                          )
                        : "Never"}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleFileSelect("dars")}
                    disabled={darsState.isUploading}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      {darsState.isUploading ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">
                        {darsState.isUploading
                          ? "Uploading DARS..."
                          : documentStatus.darsStatus === "completed"
                          ? "Re-upload DARS Report"
                          : "Upload DARS Report"}
                      </span>
                      {documentStatus.darsStatus === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => handleFileSelect("cv")}
                    disabled={cvState.isUploading}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      {cvState.isUploading ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">
                        {cvState.isUploading
                          ? "Uploading Resume..."
                          : documentStatus.cvStatus === "completed"
                          ? "Re-upload Resume/CV"
                          : "Upload Resume/CV"}
                      </span>
                      {documentStatus.cvStatus === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
