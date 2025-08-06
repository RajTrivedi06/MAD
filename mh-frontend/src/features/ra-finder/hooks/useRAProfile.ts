import { useMemo } from "react";
import { useProfileData } from "./useProfileData";

export function useRAProfile(userId?: string) {
  const { profile, loading, error, updateProfile } = useProfileData(userId);

  // Extract relevant data for RA matching
  const raProfileData = useMemo(() => {
    if (!profile) return null;

    return {
      // Basic info
      fullName: profile.full_name,
      email: profile.email,

      // Academic data
      darsData: profile.dars_data,
      cvData: profile.cv_data,

      // Extract courses from DARS data
      courses: profile.dars_data?.courses || [],

      // Extract skills from CV data
      skills: profile.cv_data?.skills || [],

      // Extract experience from CV data
      experience: profile.cv_data?.experience || [],

      // Extract education from CV data
      education: profile.cv_data?.education || [],

      // Preferences for research interests
      preferences: profile.preferences || {},
    };
  }, [profile]);

  // Helper function to get courses by department
  const getCoursesByDepartment = (department: string) => {
    if (!raProfileData?.courses) return [];

    return raProfileData.courses.filter(
      (course: any) =>
        course.department?.toLowerCase().includes(department.toLowerCase()) ||
        course.subject?.toLowerCase().includes(department.toLowerCase())
    );
  };

  // Helper function to get skills by category
  const getSkillsByCategory = (category: string) => {
    if (!raProfileData?.skills) return [];

    return raProfileData.skills.filter(
      (skill: any) =>
        skill.category?.toLowerCase().includes(category.toLowerCase()) ||
        skill.name?.toLowerCase().includes(category.toLowerCase())
    );
  };

  // Helper function to calculate research interests score
  const calculateResearchInterestScore = (researchAreas: string[]) => {
    if (!raProfileData) return 0;

    let score = 0;
    const totalAreas = researchAreas.length;

    researchAreas.forEach((area) => {
      // Check if area matches any courses
      const matchingCourses = getCoursesByDepartment(area);
      if (matchingCourses.length > 0) {
        score += 30; // Course relevance
      }

      // Check if area matches any skills
      const matchingSkills = getSkillsByCategory(area);
      if (matchingSkills.length > 0) {
        score += 25; // Skill relevance
      }

      // Check if area matches preferences
      if (raProfileData.preferences?.researchInterests?.includes(area)) {
        score += 20; // Interest alignment
      }
    });

    return Math.min(100, Math.round(score / totalAreas));
  };

  return {
    profile: raProfileData,
    loading,
    error,
    updateProfile,
    getCoursesByDepartment,
    getSkillsByCategory,
    calculateResearchInterestScore,
  };
}
