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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_channels: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      heartbeats: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          response_time_ms: number | null
          service_id: string | null
          status: string
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          response_time_ms?: number | null
          service_id?: string | null
          status: string
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          response_time_ms?: number | null
          service_id?: string | null
          status?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "heartbeats_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heartbeats_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          cause: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          resolution: string | null
          service_id: string | null
          started_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          cause?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          resolution?: string | null
          service_id?: string | null
          started_at: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          cause?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          resolution?: string | null
          service_id?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_alert_channels: {
        Row: {
          alert_channel_id: string
          service_id: string
        }
        Insert: {
          alert_channel_id: string
          service_id: string
        }
        Update: {
          alert_channel_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_alert_channels_alert_channel_id_fkey"
            columns: ["alert_channel_id"]
            isOneToOne: false
            referencedRelation: "alert_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_alert_channels_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_alert_channels_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          body: string | null
          container_name: string | null
          created_at: string | null
          description: string | null
          dns_record_type: string | null
          dns_server: string | null
          docker_host: string | null
          expected_status: number[] | null
          expected_value: string | null
          headers: Json | null
          hostname: string | null
          id: string
          interval_seconds: number | null
          is_active: boolean | null
          is_paused: boolean | null
          is_public: boolean | null
          json_path: string | null
          keyword: string | null
          method: string | null
          name: string
          next_check: string | null
          port: number | null
          retries: number | null
          ssl_expiry_alert_days: number | null
          tags: string[] | null
          timeout_seconds: number | null
          type: string
          updated_at: string | null
          url: string | null
          user_id: string | null
          verify_ssl: boolean | null
        }
        Insert: {
          body?: string | null
          container_name?: string | null
          created_at?: string | null
          description?: string | null
          dns_record_type?: string | null
          dns_server?: string | null
          docker_host?: string | null
          expected_status?: number[] | null
          expected_value?: string | null
          headers?: Json | null
          hostname?: string | null
          id?: string
          interval_seconds?: number | null
          is_active?: boolean | null
          is_paused?: boolean | null
          is_public?: boolean | null
          json_path?: string | null
          keyword?: string | null
          method?: string | null
          name: string
          next_check?: string | null
          port?: number | null
          retries?: number | null
          ssl_expiry_alert_days?: number | null
          tags?: string[] | null
          timeout_seconds?: number | null
          type: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verify_ssl?: boolean | null
        }
        Update: {
          body?: string | null
          container_name?: string | null
          created_at?: string | null
          description?: string | null
          dns_record_type?: string | null
          dns_server?: string | null
          docker_host?: string | null
          expected_status?: number[] | null
          expected_value?: string | null
          headers?: Json | null
          hostname?: string | null
          id?: string
          interval_seconds?: number | null
          is_active?: boolean | null
          is_paused?: boolean | null
          is_public?: boolean | null
          json_path?: string | null
          keyword?: string | null
          method?: string | null
          name?: string
          next_check?: string | null
          port?: number | null
          retries?: number | null
          ssl_expiry_alert_days?: number | null
          tags?: string[] | null
          timeout_seconds?: number | null
          type?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verify_ssl?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      service_status: {
        Row: {
          id: string | null
          is_public: boolean | null
          last_check: string | null
          name: string | null
          response_time_ms: number | null
          status: string | null
          type: string | null
          uptime_24h: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
