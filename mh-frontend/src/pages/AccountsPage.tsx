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
  Award,
  TrendingUp,
  Sparkles,
  GraduationCap,
  BookOpen,
  Activity,
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
import { useRouter } from "@tanstack/react-router";
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
  const [activeTab, setActiveTab] = useState("profile");
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

    console.log("🔍 Loading profile for user:", user.id);

    try {
      const { profile: userProfile, error } = await getProfile(user.id);

      console.log("📊 Profile fetch result:", { userProfile, error });

      if (error) {
        console.error("❌ Error loading profile:", error);

        // If profile doesn't exist, try to create it
        if (error.code === "PGRST116") {
          // No rows returned
          console.log("🔄 Profile not found, creating...");
          const { profile: newProfile, error: createError } =
            await createProfile(
              user.id,
              user.email!,
              user.user_metadata?.first_name,
              user.user_metadata?.last_name
            );

          if (createError) {
            console.error("❌ Error creating profile:", createError);
            setError("Failed to create profile");
          } else {
            console.log("✅ Profile created successfully:", newProfile);
            setProfile(newProfile);
            if (newProfile) {
              setEditedProfile({
                first_name: newProfile.first_name || "",
                last_name: newProfile.last_name || "",
                email: newProfile.email || "",
                full_name: newProfile.full_name || "",
              });
            }
          }
        } else {
          setError("Failed to load profile");
        }
        return;
      }

      console.log("✅ Profile loaded successfully:", userProfile);
      setProfile(userProfile);

      if (userProfile) {
        setEditedProfile({
          first_name: userProfile.first_name || "",
          last_name: userProfile.last_name || "",
          email: userProfile.email || "",
          full_name: userProfile.full_name || "",
        });
      }
    } catch (err) {
      console.error("💥 Unexpected error loading profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkDocumentStatus = useCallback(async () => {
    if (!user) return;

    try {
      await getDocumentStatus();
    } catch (error) {
      console.error("Error checking document status:", error);
    }
  }, [user, getDocumentStatus]);

  useEffect(() => {
    if (user) {
      loadProfile();
      checkDocumentStatus();
    } else if (!authLoading) {
      router.navigate({ to: "/login" });
    }
  }, [user, authLoading, loadProfile, checkDocumentStatus, router]);

  // Add profile update listener
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile();
      checkDocumentStatus();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [loadProfile, checkDocumentStatus]);

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
      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
      setTimeout(() => setNotification(null), 5000);
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
      router.navigate({ to: "/" });
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

  const stats = [
    {
      icon: GraduationCap,
      label: "GPA",
      value: "3.85",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: BookOpen,
      label: "Credits",
      value: "72",
      color: "from-green-400 to-green-600",
    },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Gradient */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your profile information and academic documents
          </p>
        </div>

        {/* Notification with Animation */}
        {notification && (
          <div className="mb-6 animate-slideDown">
            <Alert
              className={`backdrop-blur-lg ${
                notification.type === "success"
                  ? "bg-green-50/90 border-2 border-green-200"
                  : "bg-red-50/90 border-2 border-red-200"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <AlertDescription
                className={`font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {notification.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${stat.color}"></div>
              <div className="p-6">
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg mb-3`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 backdrop-blur-lg bg-white/95">
              <div className="space-y-2">
                {[{ icon: User, label: "Profile", id: "profile" }].map(
                  (item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </button>
                  )
                )}
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 text-red-600 hover:bg-red-50 p-4 rounded-xl transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Activity Card */}
            <Card className="mt-6 p-6 backdrop-blur-lg bg-white/95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-red-500" />
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      DARS Report uploaded
                    </p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Profile updated</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Password changed</p>
                    <p className="text-xs text-gray-500">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-lg bg-white/95">
              {/* Profile Header with Gradient Background */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-orange-500"></div>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative group">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-3xl font-bold text-red-600 shadow-2xl group-hover:shadow-3xl transition-all duration-300 transform group-hover:scale-105">
                          {profile?.first_name?.[0] || "U"}
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gray-100 hover:bg-gray-50 transition-all duration-300 transform hover:scale-110">
                          <Camera className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <div className="text-white">
                        <h2 className="text-3xl font-bold mb-1">
                          {profile?.full_name || "User"}
                        </h2>
                        <p className="text-white/90 flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {profile?.email}
                        </p>
                        <p className="text-sm text-white/75 mt-2 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Member since{" "}
                          {profile?.created_at
                            ? formatDate(profile.created_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        onClick={handleEdit}
                        variant="outline"
                        className="bg-white/90 backdrop-blur"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Profile Form with Enhanced Inputs */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="group-hover:border-red-400"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all duration-300">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {profile?.first_name ||
                              user?.user_metadata?.first_name ||
                              "Not set"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="group-hover:border-red-400"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all duration-300">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {profile?.last_name ||
                              user?.user_metadata?.last_name ||
                              "Not set"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all duration-300">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 font-medium flex-1">
                        {profile?.email}
                      </span>
                      <span className="text-xs text-white bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 rounded-full font-medium">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  {/* Action Buttons with Enhanced Styling */}
                  {isEditing && (
                    <div className="flex items-center space-x-4 pt-6 border-t-2 border-gray-100">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="min-w-[140px]"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Document Upload Cards with Enhanced Design */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="group relative overflow-hidden backdrop-blur-lg bg-white/95 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      DARS Report
                    </h3>
                    {documentStatus.darsStatus === "completed" && (
                      <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Status</span>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          documentStatus.darsStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {documentStatus.darsStatus === "completed"
                          ? "Uploaded"
                          : "Not uploaded"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleFileSelect("dars")}
                      disabled={darsState.isUploading}
                      className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {darsState.isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                        <span>
                          {darsState.isUploading
                            ? "Uploading..."
                            : documentStatus.darsStatus === "completed"
                            ? "Re-upload DARS"
                            : "Upload DARS"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="group relative overflow-hidden backdrop-blur-lg bg-white/95 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Resume/CV
                    </h3>
                    {documentStatus.cvStatus === "completed" && (
                      <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Status</span>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          documentStatus.cvStatus === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {documentStatus.cvStatus === "completed"
                          ? "Uploaded"
                          : "Not uploaded"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleFileSelect("cv")}
                      disabled={cvState.isUploading}
                      className="w-full p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {cvState.isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                        <span>
                          {cvState.isUploading
                            ? "Uploading..."
                            : documentStatus.cvStatus === "completed"
                            ? "Re-upload Resume"
                            : "Upload Resume"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
