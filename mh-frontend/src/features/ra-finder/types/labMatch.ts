export interface LabMatch {
  id: string;
  labTitle: string;
  piName: string;
  department: string;
  fitScore: number; // 0-100
  blurb: string;
  contactEmail: string;
  whyMatch: string;
  researchAreas: string[];
  labUrl?: string;
  openings?: boolean;
  // New fields for enhanced features
  learningResources?: LearningResource[];
  approachTips?: string[];
  relatedResearch?: RelatedResearch[];
  emailTemplateData?: EmailTemplateData;
}

export interface LearningResource {
  title: string;
  type: "video" | "article" | "course" | "paper";
  url: string;
  description: string;
  duration?: string; // For videos/courses
}

export interface RelatedResearch {
  title: string;
  authors: string[];
  url: string;
  year: number;
  summary: string;
}

export interface EmailTemplateData {
  subjectSuggestions: string[];
  keyPoints: string[];
  researchAlignment: string;
  personalizedHooks: string[];
}

export interface FilterOptions {
  department?: string;
  minScore?: number;
  openingsOnly?: boolean;
  sortBy?: "score" | "newest" | "department";
}

export interface ApplicationStatus {
  applied: boolean;
  appliedDate?: Date;
  responseReceived?: boolean;
  notes?: string;
}

export type EmailTone = "formal" | "friendly" | "enthusiastic";
