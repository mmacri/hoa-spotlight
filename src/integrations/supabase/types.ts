export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_responses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          responder_user_id: string | null
          review_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          responder_user_id?: string | null
          review_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          responder_user_id?: string | null
          review_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved: boolean | null
          content: string
          created_at: string
          id: string
          name: string | null
          post_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          content: string
          created_at?: string
          id?: string
          name?: string | null
          post_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          content?: string
          created_at?: string
          id?: string
          name?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bulk_operations: {
        Row: {
          created_at: string
          details: Json | null
          failed_records: number | null
          file_name: string | null
          hoa_id: string | null
          id: string
          operation_type: string
          operator_user_id: string
          successful_records: number | null
          total_records: number | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          failed_records?: number | null
          file_name?: string | null
          hoa_id?: string | null
          id?: string
          operation_type: string
          operator_user_id: string
          successful_records?: number | null
          total_records?: number | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          failed_records?: number | null
          file_name?: string | null
          hoa_id?: string | null
          id?: string
          operation_type?: string
          operator_user_id?: string
          successful_records?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_user_id: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          updated_at: string | null
        }
        Insert: {
          author_user_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string | null
        }
        Update: {
          author_user_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json | null
          hoa_id: string
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json | null
          hoa_id: string
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json | null
          hoa_id?: string
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      community_resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          display_order: number | null
          hoa_id: string
          id: string
          is_public: boolean
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          display_order?: number | null
          hoa_id: string
          id?: string
          is_public?: boolean
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number | null
          hoa_id?: string
          id?: string
          is_public?: boolean
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_resources_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          hoa_id: string | null
          id: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          hoa_id?: string | null
          id?: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          hoa_id?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          hoa_id: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          hoa_id?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          hoa_id?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reporter_user_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["flag_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["flag_target"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["flag_status"] | null
          target_id: string
          target_type: Database["public"]["Enums"]["flag_target"]
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["flag_status"] | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["flag_target"]
        }
        Relationships: []
      }
      hoa_creation_requests: {
        Row: {
          amenities: string[] | null
          city: string | null
          created_at: string
          description_private: string | null
          description_public: string | null
          id: string
          name: string
          requester_user_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: Database["public"]["Enums"]["content_status"]
          unit_count: number | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description_private?: string | null
          description_public?: string | null
          id?: string
          name: string
          requester_user_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          unit_count?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          description_private?: string | null
          description_public?: string | null
          id?: string
          name?: string
          requester_user_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          unit_count?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      hoas: {
        Row: {
          amenities: string[] | null
          city: string | null
          created_at: string | null
          description_private: string | null
          description_public: string | null
          id: string
          name: string
          search_vector: unknown | null
          slug: string
          state: string | null
          unit_count: number | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          amenities?: string[] | null
          city?: string | null
          created_at?: string | null
          description_private?: string | null
          description_public?: string | null
          id?: string
          name: string
          search_vector?: unknown | null
          slug: string
          state?: string | null
          unit_count?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          amenities?: string[] | null
          city?: string | null
          created_at?: string | null
          description_private?: string | null
          description_public?: string | null
          id?: string
          name?: string
          search_vector?: unknown | null
          slug?: string
          state?: string | null
          unit_count?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          hoa_id: string | null
          id: string
          notes: string | null
          requested_at: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string | null
          link: string | null
          technologies: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order: number
          id?: string
          image_url?: string | null
          link?: string | null
          technologies?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string | null
          link?: string | null
          technologies?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_user_id: string | null
          content: string
          created_at: string | null
          hoa_id: string | null
          id: string
          is_pinned: boolean | null
          search_vector: unknown | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Insert: {
          author_user_id?: string | null
          content: string
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          is_pinned?: boolean | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Update: {
          author_user_id?: string | null
          content?: string
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          is_pinned?: boolean | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      resume_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          location: string | null
          organization: string | null
          section_id: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order: number
          end_date?: string | null
          id?: string
          location?: string | null
          organization?: string | null
          section_id: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          location?: string | null
          organization?: string | null
          section_id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resume_items_section_id"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          hoa_id: string | null
          id: string
          is_anonymous: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          stars: number
          status: Database["public"]["Enums"]["content_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          stars: number
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          hoa_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          stars?: number
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      role_promotion_requests: {
        Row: {
          created_at: string
          current_membership_role: Database["public"]["Enums"]["membership_role"]
          hoa_id: string
          id: string
          justification: string | null
          requested_role: Database["public"]["Enums"]["membership_role"]
          requester_user_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_membership_role?: Database["public"]["Enums"]["membership_role"]
          hoa_id: string
          id?: string
          justification?: string | null
          requested_role: Database["public"]["Enums"]["membership_role"]
          requester_user_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_membership_role?: Database["public"]["Enums"]["membership_role"]
          hoa_id?: string
          id?: string
          justification?: string | null
          requested_role?: Database["public"]["Enums"]["membership_role"]
          requester_user_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      rating_aggregates: {
        Row: {
          average_rating: number | null
          hoa_id: string | null
          last_review_at: string | null
          stars_1_count: number | null
          stars_2_count: number | null
          stars_3_count: number | null
          stars_4_count: number | null
          stars_5_count: number | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_comments: {
        Args: { comment_ids: string[] }
        Returns: undefined
      }
      approve_role_promotion: {
        Args: { admin_user_id: string; request_id: string }
        Returns: undefined
      }
      check_admin_status: {
        Args: { user_id?: string }
        Returns: boolean
      }
      create_hoa_from_request: {
        Args: { admin_user_id: string; request_id: string }
        Returns: string
      }
      delete_hoa_cascade: {
        Args: { admin_user_id: string; hoa_id_param: string }
        Returns: undefined
      }
      generate_hoa_slug: {
        Args: { hoa_name: string }
        Returns: string
      }
      get_blog_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_comments: number
          total_posts: number
        }[]
      }
      is_hoa_admin: {
        Args: { hoa_id: string; user_id: string }
        Returns: boolean
      }
      log_community_action: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_details?: Json
          p_hoa_id: string
          p_target_id?: string
          p_target_type: string
        }
        Returns: undefined
      }
      promote_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      refresh_rating_aggregates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_missing_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      view_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_name: string
          id: string
          is_admin: boolean
          username: string
        }[]
      }
    }
    Enums: {
      content_status: "PENDING" | "APPROVED" | "REJECTED"
      flag_status: "PENDING" | "RESOLVED" | "DISMISSED"
      flag_target: "REVIEW" | "POST" | "COMMENT"
      membership_role: "MEMBER" | "ADMIN" | "PRESIDENT"
      membership_status: "PENDING" | "APPROVED" | "REJECTED"
      visibility_type: "PRIVATE" | "PUBLIC"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["PENDING", "APPROVED", "REJECTED"],
      flag_status: ["PENDING", "RESOLVED", "DISMISSED"],
      flag_target: ["REVIEW", "POST", "COMMENT"],
      membership_role: ["MEMBER", "ADMIN", "PRESIDENT"],
      membership_status: ["PENDING", "APPROVED", "REJECTED"],
      visibility_type: ["PRIVATE", "PUBLIC"],
    },
  },
} as const
