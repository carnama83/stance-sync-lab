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
      agg_question_region_daily: {
        Row: {
          city: string | null
          country_iso: string | null
          created_at: string | null
          day: string
          histogram: Json
          id: string
          question_id: string
          sample_size: number
          scope: string
          state: string | null
        }
        Insert: {
          city?: string | null
          country_iso?: string | null
          created_at?: string | null
          day: string
          histogram: Json
          id?: string
          question_id: string
          sample_size: number
          scope: string
          state?: string | null
        }
        Update: {
          city?: string | null
          country_iso?: string | null
          created_at?: string | null
          day?: string
          histogram?: Json
          id?: string
          question_id?: string
          sample_size?: number
          scope?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agg_question_region_daily_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          country: string
          country_iso: string
          created_at: string | null
          display_handle: string
          dob: string
          id: string
          random_id: string
          state: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city: string
          country: string
          country_iso: string
          created_at?: string | null
          display_handle: string
          dob: string
          id: string
          random_id: string
          state: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string
          country?: string
          country_iso?: string
          created_at?: string | null
          display_handle?: string
          dob?: string
          id?: string
          random_id?: string
          state?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          source_links: Json | null
          story_id: string | null
          summary: string | null
          title: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          source_links?: Json | null
          story_id?: string | null
          summary?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          source_links?: Json | null
          story_id?: string | null
          summary?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      stance_history: {
        Row: {
          changed_at: string | null
          id: string
          prev_links: Json | null
          prev_rationale: string | null
          prev_score: number
          stance_id: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          prev_links?: Json | null
          prev_rationale?: string | null
          prev_score: number
          stance_id: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          prev_links?: Json | null
          prev_rationale?: string | null
          prev_score?: number
          stance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stance_history_stance_id_fkey"
            columns: ["stance_id"]
            isOneToOne: false
            referencedRelation: "stances"
            referencedColumns: ["id"]
          },
        ]
      }
      stances: {
        Row: {
          created_at: string | null
          extracted_confidence: number | null
          extracted_score: number | null
          id: string
          links: Json | null
          question_id: string
          rationale: string | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          extracted_confidence?: number | null
          extracted_score?: number | null
          id?: string
          links?: Json | null
          question_id: string
          rationale?: string | null
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          extracted_confidence?: number | null
          extracted_score?: number | null
          id?: string
          links?: Json | null
          question_id?: string
          rationale?: string | null
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stances_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_clusters: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          primary_sources: Json | null
          summary: string | null
          title: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          primary_sources?: Json | null
          summary?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          primary_sources?: Json | null
          summary?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          country_iso: string | null
          display_handle: string | null
          id: string | null
          random_id: string | null
          state: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          country_iso?: string | null
          display_handle?: string | null
          id?: string | null
          random_id?: string | null
          state?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          country_iso?: string | null
          display_handle?: string | null
          id?: string | null
          random_id?: string | null
          state?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gen_urlsafe_id: {
        Args: { n?: number }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
