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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_leads: {
        Row: {
          biggest_bottleneck: string
          business_name: string
          created_at: string | null
          current_tools: string[]
          email: string
          full_name: string
          id: string
          industry: string
          phone: string
          preferred_contact_method: string
          referrer: string | null
          source: string | null
          source_url: string | null
          status: string
          team_size: string
          updated_at: string | null
          user_agent: string | null
          utm_params: Json | null
        }
        Insert: {
          biggest_bottleneck: string
          business_name: string
          created_at?: string | null
          current_tools?: string[]
          email: string
          full_name: string
          id?: string
          industry: string
          phone: string
          preferred_contact_method: string
          referrer?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          team_size: string
          updated_at?: string | null
          user_agent?: string | null
          utm_params?: Json | null
        }
        Update: {
          biggest_bottleneck?: string
          business_name?: string
          created_at?: string | null
          current_tools?: string[]
          email?: string
          full_name?: string
          id?: string
          industry?: string
          phone?: string
          preferred_contact_method?: string
          referrer?: string | null
          source?: string | null
          source_url?: string | null
          status?: string
          team_size?: string
          updated_at?: string | null
          user_agent?: string | null
          utm_params?: Json | null
        }
        Relationships: []
      }
      button_clicks: {
        Row: {
          button_id: string
          clicked_at: string | null
          id: string
          page_section: string | null
          session_id: string | null
        }
        Insert: {
          button_id: string
          clicked_at?: string | null
          id?: string
          page_section?: string | null
          session_id?: string | null
        }
        Update: {
          button_id?: string
          clicked_at?: string | null
          id?: string
          page_section?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          campaign: string | null
          content: string | null
          created_at: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          lead_count: number
          lead_type: string | null
          medium: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          lead_count?: number
          lead_type?: string | null
          medium?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          lead_count?: number
          lead_type?: string | null
          medium?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          full_name: string | null
          id: string
          list_id: string
          metadata: Json | null
          source: string | null
          source_url: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          utm_params: Json | null
        }
        Insert: {
          email: string
          full_name?: string | null
          id?: string
          list_id: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          utm_params?: Json | null
        }
        Update: {
          email?: string
          full_name?: string | null
          id?: string
          list_id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "newsletter_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_settings: {
        Row: {
          description: string | null
          id: string
          is_active: boolean | null
          link: string | null
          price: string
          title: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id: string
          is_active?: boolean | null
          link?: string | null
          price: string
          title: string
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          link?: string | null
          price?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          id: string
          metadata: Json | null
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          created_at: string | null
          element_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          element_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          element_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_assets: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          resource_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          resource_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          resource_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      capture_lead_source: {
        Args: {
          p_campaign: string
          p_content: string
          p_lead_type: string
          p_medium: string
          p_source: string
        }
        Returns: string
      }
      get_source_analytics: {
        Args: { p_days?: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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