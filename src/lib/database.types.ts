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
      group_configuration_display_currencies: {
        Row: {
          currency_code: string
          group_id: string
        }
        Insert: {
          currency_code: string
          group_id: string
        }
        Update: {
          currency_code?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_configuration_display_currencies_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "iso_4217_currency_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "group_configuration_display_currencies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_configurations"
            referencedColumns: ["group_id"]
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
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_group_member_id: string | null
          created_at: string
          created_by_group_member_id: string
          expired_at: string | null
          expires_at: string
          group_id: string
          id: string
          proof_verifier: string
          recipient_email: string
          revoked_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_group_member_id?: string | null
          created_at?: string
          created_by_group_member_id: string
          expired_at?: string | null
          expires_at: string
          group_id: string
          id?: string
          proof_verifier: string
          recipient_email: string
          revoked_at?: string | null
          status: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_group_member_id?: string | null
          created_at?: string
          created_by_group_member_id?: string
          expired_at?: string | null
          expires_at?: string
          group_id?: string
          id?: string
          proof_verifier?: string
          recipient_email?: string
          revoked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_group_id_accepted_by_group_member_id_fkey"
            columns: ["group_id", "accepted_by_group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "invitations_group_id_created_by_group_member_id_fkey"
            columns: ["group_id", "created_by_group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ir003_bootstrap_requests: {
        Row: {
          actor_profile_id: string
          completed_at: string | null
          created_at: string
          group_id: string | null
          operation: string
          request_fingerprint: Json
          request_id: string
          result: Json | null
          status: string
        }
        Insert: {
          actor_profile_id: string
          completed_at?: string | null
          created_at?: string
          group_id?: string | null
          operation: string
          request_fingerprint: Json
          request_id: string
          result?: Json | null
          status: string
        }
        Update: {
          actor_profile_id?: string
          completed_at?: string | null
          created_at?: string
          group_id?: string | null
          operation?: string
          request_fingerprint?: Json
          request_id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir003_bootstrap_requests_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir003_bootstrap_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ir005_invitation_requests: {
        Row: {
          actor_profile_id: string
          completed_at: string | null
          created_at: string
          group_id: string
          invitation_id: string | null
          operation: string
          request_fingerprint: Json
          request_id: string
          status: string
        }
        Insert: {
          actor_profile_id: string
          completed_at?: string | null
          created_at?: string
          group_id: string
          invitation_id?: string | null
          operation: string
          request_fingerprint: Json
          request_id: string
          status: string
        }
        Update: {
          actor_profile_id?: string
          completed_at?: string | null
          created_at?: string
          group_id?: string
          invitation_id?: string | null
          operation?: string
          request_fingerprint?: Json
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir005_invitation_requests_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir005_invitation_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir005_invitation_requests_group_id_invitation_id_fkey"
            columns: ["group_id", "invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      ir005_lifecycle_requests: {
        Row: {
          actor_profile_id: string
          completed_at: string | null
          created_at: string
          group_id: string
          operation: string
          request_fingerprint: Json
          request_id: string
          result: Json | null
          status: string
        }
        Insert: {
          actor_profile_id: string
          completed_at?: string | null
          created_at?: string
          group_id: string
          operation: string
          request_fingerprint: Json
          request_id: string
          result?: Json | null
          status: string
        }
        Update: {
          actor_profile_id?: string
          completed_at?: string | null
          created_at?: string
          group_id?: string
          operation?: string
          request_fingerprint?: Json
          request_id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir005_lifecycle_requests_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir005_lifecycle_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
          auth_user_id: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
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
      trip_documents: {
        Row: {
          created_at: string
          event_id: string | null
          extracted: Json | null
          file_name: string
          group_id: string
          id: string
          mime_type: string
          parse_error: string | null
          parse_status: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          extracted?: Json | null
          file_name: string
          group_id: string
          id?: string
          mime_type: string
          parse_error?: string | null
          parse_status?: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          extracted?: Json | null
          file_name?: string
          group_id?: string
          id?: string
          mime_type?: string
          parse_error?: string | null
          parse_status?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_event_same_group"
            columns: ["group_id", "event_id"]
            isOneToOne: false
            referencedRelation: "trip_events"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_documents_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_documents_uploader_same_group"
            columns: ["group_id", "uploaded_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      trip_event_audience: {
        Row: {
          created_at: string
          event_id: string
          group_id: string
          group_member_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          group_id: string
          group_member_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          group_id?: string
          group_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_event_audience_event_same_group"
            columns: ["group_id", "event_id"]
            isOneToOne: false
            referencedRelation: "trip_events"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_event_audience_member_same_group"
            columns: ["group_id", "group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      trip_events: {
        Row: {
          airline: string | null
          arr_code: string | null
          booking_ref: string | null
          created_at: string
          created_by: string
          dep_code: string | null
          ends_at: string | null
          event_type: string
          flight_no: string | null
          group_id: string
          id: string
          location: string | null
          location_to: string | null
          map_url: string | null
          notes: string | null
          starts_at: string
          terminal: string | null
          title: string
          updated_at: string
        }
        Insert: {
          airline?: string | null
          arr_code?: string | null
          booking_ref?: string | null
          created_at?: string
          created_by: string
          dep_code?: string | null
          ends_at?: string | null
          event_type: string
          flight_no?: string | null
          group_id: string
          id?: string
          location?: string | null
          location_to?: string | null
          map_url?: string | null
          notes?: string | null
          starts_at: string
          terminal?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          airline?: string | null
          arr_code?: string | null
          booking_ref?: string | null
          created_at?: string
          created_by?: string
          dep_code?: string | null
          ends_at?: string | null
          event_type?: string
          flight_no?: string | null
          group_id?: string
          id?: string
          location?: string | null
          location_to?: string | null
          map_url?: string | null
          notes?: string | null
          starts_at?: string
          terminal?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_creator_same_group"
            columns: ["group_id", "created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expense_payers: {
        Row: {
          amount: number
          expense_id: string
          group_id: string
          group_member_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          group_id: string
          group_member_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          group_id?: string
          group_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_payers_expense_same_group"
            columns: ["group_id", "expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_expense_payers_member_same_group"
            columns: ["group_id", "group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      trip_expense_shares: {
        Row: {
          amount: number
          expense_id: string
          group_id: string
          group_member_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          group_id: string
          group_member_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          group_id?: string
          group_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_shares_expense_same_group"
            columns: ["group_id", "expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_expense_shares_member_same_group"
            columns: ["group_id", "group_member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          accounting_amount: number
          accounting_currency: string
          category: string | null
          created_at: string
          created_by: string
          description: string
          fx_captured_at: string | null
          fx_rate: number | null
          fx_source: string | null
          group_id: string
          id: string
          original_amount: number
          original_currency: string
          request_id: string | null
          split_method: string
          updated_at: string
          version: number
        }
        Insert: {
          accounting_amount: number
          accounting_currency: string
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          fx_captured_at?: string | null
          fx_rate?: number | null
          fx_source?: string | null
          group_id: string
          id?: string
          original_amount: number
          original_currency: string
          request_id?: string | null
          split_method: string
          updated_at?: string
          version?: number
        }
        Update: {
          accounting_amount?: number
          accounting_currency?: string
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          fx_captured_at?: string | null
          fx_rate?: number | null
          fx_source?: string | null
          group_id?: string
          id?: string
          original_amount?: number
          original_currency?: string
          request_id?: string | null
          split_method?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_accounting_currency_fkey"
            columns: ["accounting_currency"]
            isOneToOne: false
            referencedRelation: "iso_4217_currency_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trip_expenses_creator_same_group"
            columns: ["group_id", "created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_original_currency_fkey"
            columns: ["original_currency"]
            isOneToOne: false
            referencedRelation: "iso_4217_currency_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      trip_settlements: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_member: string
          group_id: string
          id: string
          note: string | null
          recorded_by: string
          request_id: string | null
          to_member: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          from_member: string
          group_id: string
          id?: string
          note?: string | null
          recorded_by: string
          request_id?: string | null
          to_member: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_member?: string
          group_id?: string
          id?: string
          note?: string | null
          recorded_by?: string
          request_id?: string | null
          to_member?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_settlements_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "iso_4217_currency_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trip_settlements_from_same_group"
            columns: ["group_id", "from_member"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_recorder_same_group"
            columns: ["group_id", "recorded_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_settlements_to_same_group"
            columns: ["group_id", "to_member"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
        ]
      }
      trip_todos: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          done: boolean
          group_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          done?: boolean
          group_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          done?: boolean
          group_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_todos_completer_same_group"
            columns: ["group_id", "completed_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_todos_creator_same_group"
            columns: ["group_id", "created_by"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "id"]
          },
          {
            foreignKeyName: "trip_todos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
      accept_invitation: {
        Args: {
          continuation_context: Json
          invitation_proof: string
          request_id: string
        }
        Returns: Json
      }
      bootstrap_group: {
        Args: {
          configuration_request: Json
          group_request: Json
          request_id: string
        }
        Returns: {
          group_id: string
          outcome: string
          request_id: string
        }[]
      }
      change_member_role: {
        Args: {
          group_id: string
          request_id: string
          requested_role: string
          target_membership_id: string
        }
        Returns: Json
      }
      commit_expense: {
        Args: {
          p_category?: string
          p_description: string
          p_fx_rate?: string
          p_fx_source?: string
          p_group_id: string
          p_original_amount: string
          p_original_currency: string
          p_payers: Json
          p_request_id?: string
          p_shares: Json
          p_split_method: string
        }
        Returns: string
      }
      create_event_from_document: {
        Args: {
          p_airline?: string
          p_arr_code?: string
          p_booking_ref?: string
          p_dep_code?: string
          p_document_id: string
          p_ends_at?: string
          p_event_type: string
          p_flight_no?: string
          p_location?: string
          p_location_to?: string
          p_notes?: string
          p_starts_at: string
          p_terminal?: string
          p_title: string
        }
        Returns: string
      }
      create_invitation: {
        Args: {
          group_id: string
          invitation_request: Json
          recipient_request: Json
          request_id: string
        }
        Returns: Json
      }
      deactivate_membership: {
        Args: {
          action: string
          confirmation: Json
          group_id: string
          request_id: string
          target_membership_id: string
        }
        Returns: Json
      }
      delete_expense: {
        Args: { p_expected_version?: number; p_expense_id: string }
        Returns: undefined
      }
      delete_settlement: {
        Args: { p_settlement_id: string }
        Returns: undefined
      }
      get_group_audit_summary: {
        Args: { p_group_id: string; p_limit?: number }
        Returns: {
          actor_participant_id: string
          audit_event_id: string
          event_type: string
          group_id: string
          occurred_at: string
        }[]
      }
      get_group_roster: {
        Args: { p_group_id: string; p_limit?: number }
        Returns: {
          display_name: string
          group_id: string
          participant_id: string
          role: string
          status: string
        }[]
      }
      get_my_archived_groups: {
        Args: never
        Returns: {
          archived_at: string
          destination: string
          end_date: string
          group_id: string
          start_date: string
          trip_name: string
        }[]
      }
      get_my_group_access: {
        Args: never
        Returns: {
          accounting_currency: string
          destination: string
          end_date: string
          group_id: string
          group_member_id: string
          role: string
          start_date: string
          timezone: string
          trip_name: string
        }[]
      }
      get_split_ledger: { Args: { p_group_id: string }; Returns: Json }
      inspect_invitation: { Args: { invitation_proof: string }; Returns: Json }
      ir003_bootstrap_group_impl: {
        Args: {
          p_configuration_request: Json
          p_group_request: Json
          p_request_id: string
        }
        Returns: {
          group_id: string
          outcome: string
          request_id: string
        }[]
      }
      ir005_accept_invitation_impl: {
        Args: {
          p_continuation_context: Json
          p_invitation_proof: string
          p_request_id: string
        }
        Returns: Json
      }
      ir005_change_member_role_impl: {
        Args: {
          p_group_id: string
          p_request_id: string
          p_requested_role: string
          p_target_membership_id: string
        }
        Returns: Json
      }
      ir005_create_invitation_impl: {
        Args: {
          p_group_id: string
          p_invitation_request: Json
          p_recipient_request: Json
          p_request_id: string
        }
        Returns: Json
      }
      ir005_deactivate_membership_impl: {
        Args: {
          p_action: string
          p_confirmation: Json
          p_group_id: string
          p_request_id: string
          p_target_membership_id: string
        }
        Returns: Json
      }
      ir005_inspect_invitation_impl: {
        Args: { p_invitation_proof: string }
        Returns: Json
      }
      ir005_list_group_invitations_impl: {
        Args: {
          p_before_created_at: string
          p_before_invitation_id: string
          p_group_id: string
        }
        Returns: Json
      }
      ir005_revoke_invitation_impl: {
        Args: {
          p_group_id: string
          p_invitation_id: string
          p_request_id: string
        }
        Returns: Json
      }
      ir005_set_group_archive_state_impl: {
        Args: {
          p_desired_archive_state: string
          p_group_id: string
          p_request_id: string
        }
        Returns: Json
      }
      ir005_transfer_ownership_impl: {
        Args: {
          p_group_id: string
          p_prior_owner_outcome: string
          p_request_id: string
          p_successor_membership_id: string
        }
        Returns: Json
      }
      is_valid_iana_timezone: { Args: { candidate: string }; Returns: boolean }
      list_group_invitations: {
        Args: {
          before_created_at: string
          before_invitation_id: string
          group_id: string
        }
        Returns: Json
      }
      record_settlement: {
        Args: {
          p_amount: string
          p_from_member: string
          p_group_id: string
          p_note?: string
          p_request_id?: string
          p_to_member: string
        }
        Returns: string
      }
      revoke_invitation: {
        Args: { group_id: string; invitation_id: string; request_id: string }
        Returns: Json
      }
      set_group_archive_state: {
        Args: {
          desired_archive_state: string
          group_id: string
          request_id: string
        }
        Returns: Json
      }
      set_trip_event_audience: {
        Args: { p_event_id: string; p_group_id: string; p_member_ids: string[] }
        Returns: undefined
      }
      transfer_ownership: {
        Args: {
          group_id: string
          prior_owner_outcome: string
          request_id: string
          successor_membership_id: string
        }
        Returns: Json
      }
      update_expense: {
        Args: {
          p_category?: string
          p_description: string
          p_expected_version: number
          p_expense_id: string
          p_fx_rate?: string
          p_fx_source?: string
          p_original_amount: string
          p_original_currency: string
          p_payers: Json
          p_shares: Json
          p_split_method: string
        }
        Returns: number
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

