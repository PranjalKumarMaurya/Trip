export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          airline: string | null
          arr_code: string | null
          booking_ref: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          date_ist: string
          dep_code: string | null
          doc_source: string | null
          doc_storage_path: string | null
          end_date_ist: string | null
          flight_no: string | null
          for_users: string[] | null
          gmap_url: string | null
          icon: string | null
          id: string
          location: string | null
          location_to: string | null
          notes: string | null
          sort_order: number | null
          terminal: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          airline?: string | null
          arr_code?: string | null
          booking_ref?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date_ist: string
          dep_code?: string | null
          doc_source?: string | null
          doc_storage_path?: string | null
          end_date_ist?: string | null
          flight_no?: string | null
          for_users?: string[] | null
          gmap_url?: string | null
          icon?: string | null
          id?: string
          location?: string | null
          location_to?: string | null
          notes?: string | null
          sort_order?: number | null
          terminal?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          airline?: string | null
          arr_code?: string | null
          booking_ref?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date_ist?: string
          dep_code?: string | null
          doc_source?: string | null
          doc_storage_path?: string | null
          end_date_ist?: string | null
          flight_no?: string | null
          for_users?: string[] | null
          gmap_url?: string | null
          icon?: string | null
          id?: string
          location?: string | null
          location_to?: string | null
          notes?: string | null
          sort_order?: number | null
          terminal?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          fetched_at: string | null
          from_currency: string
          id: string
          rate: number
          to_currency: string
        }
        Insert: {
          fetched_at?: string | null
          from_currency: string
          id?: string
          rate: number
          to_currency: string
        }
        Update: {
          fetched_at?: string | null
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_idr: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          custom_splits: Json | null
          date: string | null
          description: string
          event_id: string | null
          id: string
          notes: string | null
          paid_by: string
          paid_by_splits: Json | null
          settled: boolean | null
          split_among: string[]
          split_mode: string | null
        }
        Insert: {
          amount?: number
          amount_idr?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          custom_splits?: Json | null
          date?: string | null
          description: string
          event_id?: string | null
          id?: string
          notes?: string | null
          paid_by: string
          paid_by_splits?: Json | null
          settled?: boolean | null
          split_among: string[]
          split_mode?: string | null
        }
        Update: {
          amount?: number
          amount_idr?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          custom_splits?: Json | null
          date?: string | null
          description?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          paid_by?: string
          paid_by_splits?: Json | null
          settled?: boolean | null
          split_among?: string[]
          split_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_audit_events: {
        Row: {
          actor_group_member_id: string
          created_at: string
          details: Json
          event_type: string
          group_id: string
          id: string
          occurred_at: string
          request_id: string
        }
        Insert: {
          actor_group_member_id: string
          created_at?: string
          details?: Json
          event_type: string
          group_id: string
          id?: string
          occurred_at: string
          request_id: string
        }
        Update: {
          actor_group_member_id?: string
          created_at?: string
          details?: Json
          event_type?: string
          group_id?: string
          id?: string
          occurred_at?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_audit_events_group_id_actor_group_member_id_fkey"
            columns: ["group_id", "actor_group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "group_audit_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_configurations: {
        Row: {
          accounting_currency: string
          created_at: string
          destination: string
          end_date: string
          group_id: string
          start_date: string
          timezone: string
          trip_name: string
          updated_at: string
        }
        Insert: {
          accounting_currency: string
          created_at?: string
          destination: string
          end_date: string
          group_id: string
          start_date: string
          timezone: string
          trip_name: string
          updated_at?: string
        }
        Update: {
          accounting_currency?: string
          created_at?: string
          destination?: string
          end_date?: string
          group_id?: string
          start_date?: string
          timezone?: string
          trip_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_configurations_accounting_currency_fkey"
            columns: ["accounting_currency"]
            isOneToOne: false
            referencedRelation: "iso_4217_currency_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "group_configurations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          profile_id: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          profile_id?: string | null
          role: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          profile_id?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      iso_4217_currency_codes: {
        Row: {
          code: string
        }
        Insert: {
          code: string
        }
        Update: {
          code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          from_user: string
          id: string
          notes: string | null
          recorded_by: string | null
          to_user: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          from_user: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          to_user: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          from_user?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          to_user?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string | null
          id: string
          text: string
          user_name: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          id?: string
          text: string
          user_name: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          id?: string
          text?: string
          user_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          name: string
          pin: string | null
          vibe: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name: string
          pin?: string | null
          vibe?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          pin?: string | null
          vibe?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_valid_iana_timezone: { Args: { candidate: string }; Returns: boolean }
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

