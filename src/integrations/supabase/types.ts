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
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      aggregate_snapshots: {
        Row: {
          created_by: string | null
          dist: Json
          id: string
          k_threshold: number
          region: string | null
          sample_size: number
          scope: string
          snapshot_at: string
          topic: string | null
          trend: Json | null
          version: string
        }
        Insert: {
          created_by?: string | null
          dist: Json
          id?: string
          k_threshold?: number
          region?: string | null
          sample_size: number
          scope: string
          snapshot_at?: string
          topic?: string | null
          trend?: Json | null
          version?: string
        }
        Update: {
          created_by?: string | null
          dist?: Json
          id?: string
          k_threshold?: number
          region?: string | null
          sample_size?: number
          scope?: string
          snapshot_at?: string
          topic?: string | null
          trend?: Json | null
          version?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          alt_names: Json | null
          country_iso2: string
          county_id: string | null
          id: string
          lat: number | null
          lon: number | null
          name: string
          population: number | null
          region_id: string
        }
        Insert: {
          alt_names?: Json | null
          country_iso2: string
          county_id?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          name: string
          population?: number | null
          region_id: string
        }
        Update: {
          alt_names?: Json | null
          country_iso2?: string
          county_id?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          name?: string
          population?: number | null
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_iso2_fkey"
            columns: ["country_iso2"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["iso2"]
          },
          {
            foreignKeyName: "cities_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          question_id: string
          toxicity_flag: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          question_id: string
          toxicity_flag?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          question_id?: string
          toxicity_flag?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          id: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted: boolean
          id?: string
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      counties: {
        Row: {
          country_iso2: string
          fips_code: string | null
          id: string
          name: string
          region_id: string
        }
        Insert: {
          country_iso2: string
          fips_code?: string | null
          id?: string
          name: string
          region_id: string
        }
        Update: {
          country_iso2?: string
          fips_code?: string | null
          id?: string
          name?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counties_country_iso2_fkey"
            columns: ["country_iso2"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["iso2"]
          },
          {
            foreignKeyName: "counties_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          continent_code: string | null
          emoji: string | null
          iso2: string
          iso3: string | null
          name: string
        }
        Insert: {
          continent_code?: string | null
          emoji?: string | null
          iso2: string
          iso3?: string | null
          name: string
        }
        Update: {
          continent_code?: string | null
          emoji?: string | null
          iso2?: string
          iso3?: string | null
          name?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          delete_after: string
          error: string | null
          purged_at: string | null
          requested_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          confirm_token: string
          confirmed_at?: string | null
          delete_after: string
          error?: string | null
          purged_at?: string | null
          requested_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          delete_after?: string
          error?: string | null
          purged_at?: string | null
          requested_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          file_path: string | null
          filters: Json
          format: string
          id: string
          k_threshold: number
          requested_by: string
          row_count: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          filters?: Json
          format: string
          id?: string
          k_threshold?: number
          requested_by: string
          row_count?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          filters?: Json
          format?: string
          id?: string
          k_threshold?: number
          requested_by?: string
          row_count?: number | null
          status?: string
        }
        Relationships: []
      }
      ingestion_health: {
        Row: {
          created_at: string | null
          id: string
          info: string | null
          source_id: string | null
          stage: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          info?: string | null
          source_id?: string | null
          stage: string
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          info?: string | null
          source_id?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_health_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      inline_insights_cache: {
        Row: {
          dist: Json
          question_id: string
          region_key: string
          region_level: Database["public"]["Enums"]["region_level"]
          sample_size: number
          updated_at: string | null
        }
        Insert: {
          dist?: Json
          question_id: string
          region_key: string
          region_level: Database["public"]["Enums"]["region_level"]
          sample_size?: number
          updated_at?: string | null
        }
        Update: {
          dist?: Json
          question_id?: string
          region_key?: string
          region_level?: Database["public"]["Enums"]["region_level"]
          sample_size?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inline_insights_cache_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          created_at: string | null
          id: string
          job_name: string
          stats: Json | null
          status: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_name: string
          stats?: Json | null
          status?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_name?: string
          stats?: Json | null
          status?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          comment_id: string
          created_at: string | null
          id: string
          moderator_id: string | null
          notes: string | null
        }
        Insert: {
          action: string
          comment_id: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          notes?: string | null
        }
        Update: {
          action?: string
          comment_id?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          base_url: string | null
          enabled: boolean | null
          id: string
          last_latency_ms: number | null
          last_status: string | null
          name: string
          polling_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          base_url?: string | null
          enabled?: boolean | null
          id?: string
          last_latency_ms?: number | null
          last_status?: string | null
          name: string
          polling_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string | null
          enabled?: boolean | null
          id?: string
          last_latency_ms?: number | null
          last_status?: string | null
          name?: string
          polling_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          alerts_enabled: boolean | null
          channel_email: boolean | null
          channel_inapp: boolean | null
          threshold_shift: number | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          channel_email?: boolean | null
          channel_inapp?: boolean | null
          threshold_shift?: number | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          alerts_enabled?: boolean | null
          channel_email?: boolean | null
          channel_inapp?: boolean | null
          threshold_shift?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          created_at: string | null
          enabled: boolean
          s_key: string
          s_type: Database["public"]["Enums"]["subscription_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          s_key: string
          s_type: Database["public"]["Enums"]["subscription_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          s_key?: string
          s_type?: Database["public"]["Enums"]["subscription_type"]
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          is_public_profile: boolean | null
          show_age: boolean | null
          show_location: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_public_profile?: boolean | null
          show_age?: boolean | null
          show_location?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_public_profile?: boolean | null
          show_age?: boolean | null
          show_location?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          city_id: string | null
          country: string
          country_iso: string
          county_id: string | null
          created_at: string | null
          display_handle: string
          dob: string
          id: string
          random_id: string
          region_id: string | null
          state: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city: string
          city_id?: string | null
          country: string
          country_iso: string
          county_id?: string | null
          created_at?: string | null
          display_handle: string
          dob: string
          id: string
          random_id: string
          region_id?: string | null
          state: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string
          city_id?: string | null
          country?: string
          country_iso?: string
          county_id?: string | null
          created_at?: string | null
          display_handle?: string
          dob?: string
          id?: string
          random_id?: string
          region_id?: string | null
          state?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_fk"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_county_fk"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_fk"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
      regions: {
        Row: {
          code: string
          country_iso2: string
          id: string
          name: string
          type: string | null
        }
        Insert: {
          code: string
          country_iso2: string
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          code?: string
          country_iso2?: string
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_iso2_fkey"
            columns: ["country_iso2"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["iso2"]
          },
        ]
      }
      reports: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          severity: string | null
          status: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
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
          city_id: string | null
          country_iso: string | null
          county_id: string | null
          created_at: string | null
          extracted_confidence: number | null
          extracted_score: number | null
          id: string
          links: Json | null
          question_id: string
          rationale: string | null
          region_id: string | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city_id?: string | null
          country_iso?: string | null
          county_id?: string | null
          created_at?: string | null
          extracted_confidence?: number | null
          extracted_score?: number | null
          id?: string
          links?: Json | null
          question_id: string
          rationale?: string | null
          region_id?: string | null
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city_id?: string | null
          country_iso?: string | null
          county_id?: string | null
          created_at?: string | null
          extracted_confidence?: number | null
          extracted_score?: number | null
          id?: string
          links?: Json | null
          question_id?: string
          rationale?: string | null
          region_id?: string | null
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
          display_handle: string | null
          id: string | null
          random_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_handle?: string | null
          id?: string | null
          random_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_handle?: string | null
          id?: string | null
          random_id?: string | null
        }
        Relationships: []
      }
      question_region_agg: {
        Row: {
          bucket: number | null
          city_id: string | null
          cnt: number | null
          country_iso: string | null
          geo_scope: string | null
          question_id: string | null
          region_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_admin: {
        Args: {
          p_admin_email: string
          p_admin_password: string
          p_email: string
          p_password: string
        }
        Returns: string
      }
      cities_by_region: {
        Args: { p_region: string }
        Returns: {
          id: string
          name: string
          population: number
        }[]
      }
      counties_by_region: {
        Args: { p_region: string }
        Returns: {
          fips_code: string
          id: string
          name: string
        }[]
      }
      countries_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          emoji: string
          iso2: string
          name: string
        }[]
      }
      ensure_notif_settings: {
        Args: { p_user: string }
        Returns: undefined
      }
      gen_urlsafe_id: {
        Args: { n?: number }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      profiles_set_location: {
        Args: { p_city: string; p_county: string; p_region: string }
        Returns: undefined
      }
      regions_by_country: {
        Args: { p_iso2: string }
        Returns: {
          code: string
          id: string
          name: string
          type: string
        }[]
      }
      rpc_stances_with_location: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          country_iso: string
          question_id: string
          score: number
          state: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      region_level: "city" | "state" | "country" | "global"
      subscription_type: "topic" | "region" | "question"
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
      region_level: ["city", "state", "country", "global"],
      subscription_type: ["topic", "region", "question"],
    },
  },
} as const
