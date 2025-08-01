export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          avatar_url: string | null;
          preferences: any | null;
          dars_data: any | null;
          cv_data: any | null;
          processing_status: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any | null;
          dars_data?: any | null;
          cv_data?: any | null;
          processing_status?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any | null;
          dars_data?: any | null;
          cv_data?: any | null;
          processing_status?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          course_id: number;
          course_code: string | null;
          catalog_number: string | null;
          title: string | null;
          description: string | null;
          credits: string | null;
          credit_level: string | null;
          level: string | null;
          repeatable: boolean | null;
          pre_requisites: string | null;
          college: string | null;
          topic_type: boolean | null;
          learning_outcomes: string | null;
          clo_audience: string | null;
          embedding: number[] | null;
          last_taught_term: string | null;
          years_since_last_taught: string | null;
          crosslisted: boolean | null;
          subject_codes: number[] | null;
          section_url: string | null;
        };
        Insert: {
          course_id: number;
          course_code?: string | null;
          catalog_number?: string | null;
          title?: string | null;
          description?: string | null;
          credits?: string | null;
          credit_level?: string | null;
          level?: string | null;
          repeatable?: boolean | null;
          pre_requisites?: string | null;
          college?: string | null;
          topic_type?: boolean | null;
          learning_outcomes?: string | null;
          clo_audience?: string | null;
          embedding?: number[] | null;
          last_taught_term?: string | null;
          years_since_last_taught?: string | null;
          crosslisted?: boolean | null;
          subject_codes?: number[] | null;
          section_url?: string | null;
        };
        Update: {
          course_id?: number;
          course_code?: string | null;
          catalog_number?: string | null;
          title?: string | null;
          description?: string | null;
          credits?: string | null;
          credit_level?: string | null;
          level?: string | null;
          repeatable?: boolean | null;
          pre_requisites?: string | null;
          college?: string | null;
          topic_type?: boolean | null;
          learning_outcomes?: string | null;
          clo_audience?: string | null;
          embedding?: number[] | null;
          last_taught_term?: string | null;
          years_since_last_taught?: string | null;
          crosslisted?: boolean | null;
          subject_codes?: number[] | null;
          section_url?: string | null;
        };
      };
      requirement_popularity: {
        Row: {
          id: number;
          course_id: number;
          college: string | null;
          category: string | null;
          requirement: string | null;
          sub_requirement: string | null;
          percent_taken: number | null;
          student_count: number | null;
          min_req_order: number | null;
        };
      };
      requirement_popularity_by_major: {
        Row: {
          id: number;
          course_id: number;
          major: string;
          college: string | null;
          requirement: string | null;
          sub_requirement: string | null;
          student_count: number | null;
          percent_within_major: number | null;
          min_req_order: number | null;
        };
      };
    };
  };
};
