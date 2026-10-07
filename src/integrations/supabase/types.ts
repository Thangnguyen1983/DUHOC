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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_provision_queue: {
        Row: {
          attempts: number
          created_at: string
          email: string
          error: string | null
          full_name: string | null
          id: string
          processed_at: string | null
          status: string
          student_profile_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          error?: string | null
          full_name?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          student_profile_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          error?: string | null
          full_name?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          student_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_provision_queue_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_locations: {
        Row: {
          box: string | null
          cabinet: string | null
          capacity: number | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          note: string | null
          room: string | null
          shelf: string | null
          updated_at: string
          warehouse: string | null
        }
        Insert: {
          box?: string | null
          cabinet?: string | null
          capacity?: number | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          room?: string | null
          shelf?: string | null
          updated_at?: string
          warehouse?: string | null
        }
        Update: {
          box?: string | null
          cabinet?: string | null
          capacity?: number | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          room?: string | null
          shelf?: string | null
          updated_at?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      attendance_change_log: {
        Row: {
          changed_by: string | null
          created_at: string
          enrollment_id: string
          from_status: string | null
          id: string
          method: string
          reason: string | null
          session_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          enrollment_id: string
          from_status?: string | null
          id?: string
          method?: string
          reason?: string | null
          session_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          enrollment_id?: string
          from_status?: string | null
          id?: string
          method?: string
          reason?: string | null
          session_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_change_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_change_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_days: {
        Row: {
          check_in: string | null
          check_in_meta: Json
          check_in_method: string | null
          check_out: string | null
          check_out_meta: Json
          created_at: string
          edited_by: string | null
          id: string
          note: string | null
          photo_path: string | null
          status: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in?: string | null
          check_in_meta?: Json
          check_in_method?: string | null
          check_out?: string | null
          check_out_meta?: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          note?: string | null
          photo_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          check_in?: string | null
          check_in_meta?: Json
          check_in_method?: string | null
          check_out?: string | null
          check_out_meta?: Json
          created_at?: string
          edited_by?: string | null
          id?: string
          note?: string | null
          photo_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      attendance_qr_sessions: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          late_after_minutes: number
          opened_at: string
          opened_by: string | null
          require_approval: boolean
          secret: string
          session_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          late_after_minutes?: number
          opened_at?: string
          opened_by?: string | null
          require_approval?: boolean
          secret: string
          session_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          late_after_minutes?: number
          opened_at?: string
          opened_by?: string | null
          require_approval?: boolean
          secret?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_qr_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          function_note: string | null
          id: string
          is_active: boolean
          market_code: string | null
          name: string
          parent_id: string | null
          program_type: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          function_note?: string | null
          id?: string
          is_active?: boolean
          market_code?: string | null
          name: string
          parent_id?: string | null
          program_type?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          function_note?: string | null
          id?: string
          is_active?: boolean
          market_code?: string | null
          name?: string
          parent_id?: string | null
          program_type?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_document_types: {
        Row: {
          code: string
          created_at: string
          default_validity_months: number | null
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          market: string | null
          name: string
          program_type: string | null
          sort_order: number
          stage: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          default_validity_months?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          market?: string | null
          name: string
          program_type?: string | null
          sort_order?: number
          stage?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_validity_months?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          market?: string | null
          name?: string
          program_type?: string | null
          sort_order?: number
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_job_titles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_languages: {
        Row: {
          created_at: string
          description: string | null
          flag: string | null
          id: string
          is_active: boolean
          levels: string[]
          name: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag?: string | null
          id?: string
          is_active?: boolean
          levels?: string[]
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag?: string | null
          id?: string
          is_active?: boolean
          levels?: string[]
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_markets: {
        Row: {
          created_at: string
          description: string | null
          flag: string | null
          highlights: string[]
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          region: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag?: string | null
          highlights?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          region?: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag?: string | null
          highlights?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          region?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_provinces: {
        Row: {
          code: string
          codename: string | null
          created_at: string
          division_type: string | null
          id: string
          is_active: boolean
          merged_note: string | null
          name: string
          short_name: string | null
          sort_order: number
          source: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          codename?: string | null
          created_at?: string
          division_type?: string | null
          id?: string
          is_active?: boolean
          merged_note?: string | null
          name: string
          short_name?: string | null
          sort_order?: number
          source?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          codename?: string | null
          created_at?: string
          division_type?: string | null
          id?: string
          is_active?: boolean
          merged_note?: string | null
          name?: string
          short_name?: string | null
          sort_order?: number
          source?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_sync_logs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          provinces_count: number | null
          started_at: string
          status: string
          trigger_source: string
          wards_count: number | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          provinces_count?: number | null
          started_at?: string
          status?: string
          trigger_source?: string
          wards_count?: number | null
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          provinces_count?: number | null
          started_at?: string
          status?: string
          trigger_source?: string
          wards_count?: number | null
        }
        Relationships: []
      }
      catalog_training_stages: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_wards: {
        Row: {
          code: string
          codename: string | null
          created_at: string
          division_type: string | null
          id: string
          is_active: boolean
          merged_note: string | null
          name: string
          province_code: string
          sort_order: number
          source: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          codename?: string | null
          created_at?: string
          division_type?: string | null
          id?: string
          is_active?: boolean
          merged_note?: string | null
          name: string
          province_code: string
          sort_order?: number
          source?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          codename?: string | null
          created_at?: string
          division_type?: string | null
          id?: string
          is_active?: boolean
          merged_note?: string | null
          name?: string
          province_code?: string
          sort_order?: number
          source?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_wards_province_code_fkey"
            columns: ["province_code"]
            isOneToOne: false
            referencedRelation: "catalog_provinces"
            referencedColumns: ["code"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          class_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string | null
          meta: Json
          pdf_path: string | null
          program_id: string | null
          recipient_name: string
          status: Database["public"]["Enums"]["certificate_status"]
          student_profile_id: string
          title: string
          updated_at: string
          verify_code: string
        }
        Insert: {
          certificate_number: string
          class_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          meta?: Json
          pdf_path?: string | null
          program_id?: string | null
          recipient_name: string
          status?: Database["public"]["Enums"]["certificate_status"]
          student_profile_id: string
          title: string
          updated_at?: string
          verify_code: string
        }
        Update: {
          certificate_number?: string
          class_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          meta?: Json
          pdf_path?: string | null
          program_id?: string | null
          recipient_name?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          student_profile_id?: string
          title?: string
          updated_at?: string
          verify_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          ended_at: string | null
          flagged_for_training: boolean
          id: string
          ip_hash: string | null
          last_message_at: string | null
          lead_captured: boolean
          message_count: number
          started_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          flagged_for_training?: boolean
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          lead_captured?: boolean
          message_count?: number
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          flagged_for_training?: boolean
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          lead_captured?: boolean
          message_count?: number
          started_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          has_cta: boolean
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          has_cta?: boolean
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          has_cta?: boolean
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_knowledge: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["chatbot_category"]
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          keywords: string[]
          priority: number
          status: Database["public"]["Enums"]["chatbot_kb_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["chatbot_category"]
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          priority?: number
          status?: Database["public"]["Enums"]["chatbot_kb_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["chatbot_category"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          priority?: number
          status?: Database["public"]["Enums"]["chatbot_kb_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      chatbot_training: {
        Row: {
          address_self: string
          address_user: string
          audience: string
          context_summary: string
          created_at: string
          created_by: string | null
          extra_rules: string
          id: string
          is_active: boolean
          language: string
          max_sentences: number
          max_words_per_sentence: number
          sample_qa: Json
          scope_allow: string
          scope_deny: string
          tone_style: string
          updated_at: string
          use_emoji: boolean
          version: number
        }
        Insert: {
          address_self?: string
          address_user?: string
          audience?: string
          context_summary?: string
          created_at?: string
          created_by?: string | null
          extra_rules?: string
          id?: string
          is_active?: boolean
          language?: string
          max_sentences?: number
          max_words_per_sentence?: number
          sample_qa?: Json
          scope_allow?: string
          scope_deny?: string
          tone_style?: string
          updated_at?: string
          use_emoji?: boolean
          version: number
        }
        Update: {
          address_self?: string
          address_user?: string
          audience?: string
          context_summary?: string
          created_at?: string
          created_by?: string | null
          extra_rules?: string
          id?: string
          is_active?: boolean
          language?: string
          max_sentences?: number
          max_words_per_sentence?: number
          sample_qa?: Json
          scope_allow?: string
          scope_deny?: string
          tone_style?: string
          updated_at?: string
          use_emoji?: boolean
          version?: number
        }
        Relationships: []
      }
      class_presentation_logs: {
        Row: {
          class_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          material_id: string | null
          session_id: string | null
          started_at: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          material_id?: string | null
          session_id?: string | null
          started_at?: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          material_id?: string | null
          session_id?: string | null
          started_at?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_presentation_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_presentation_logs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "learning_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_presentation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          id: number
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: number
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          id?: number
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      cms_categories: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_types: {
        Row: {
          created_at: string
          description: string | null
          field_schema: Json
          icon: string | null
          id: string
          is_active: boolean
          is_singleton: boolean
          name: string
          slug: string
          sort_order: number
          template: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_singleton?: boolean
          name: string
          slug: string
          sort_order?: number
          template?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_singleton?: boolean
          name?: string
          slug?: string
          sort_order?: number
          template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_entries: {
        Row: {
          author_id: string | null
          content_type_id: string
          cover_image: string | null
          created_at: string
          data: Json
          deleted_at: string | null
          excerpt: string | null
          featured: boolean
          id: string
          market: string | null
          module: string | null
          pinned: boolean
          published_at: string | null
          scheduled_at: string | null
          seo: Json
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          view_count: number
        }
        Insert: {
          author_id?: string | null
          content_type_id: string
          cover_image?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          market?: string | null
          module?: string | null
          pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          seo?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_count?: number
        }
        Update: {
          author_id?: string | null
          content_type_id?: string
          cover_image?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          market?: string | null
          module?: string | null
          pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          seo?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_entries_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "cms_content_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_entry_categories: {
        Row: {
          category_id: string
          entry_id: string
        }
        Insert: {
          category_id: string
          entry_id: string
        }
        Update: {
          category_id?: string
          entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_entry_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_entry_categories_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "cms_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_entry_revisions: {
        Row: {
          cover_image: string | null
          created_at: string
          data: Json
          editor_id: string | null
          entry_id: string
          excerpt: string | null
          id: string
          note: string | null
          seo: Json
          status: string
          title: string
          version: number
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          data?: Json
          editor_id?: string | null
          entry_id: string
          excerpt?: string | null
          id?: string
          note?: string | null
          seo?: Json
          status: string
          title: string
          version: number
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          data?: Json
          editor_id?: string | null
          entry_id?: string
          excerpt?: string | null
          id?: string
          note?: string | null
          seo?: Json
          status?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_entry_revisions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "cms_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_entry_tags: {
        Row: {
          entry_id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          tag_id: string
        }
        Update: {
          entry_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_entry_tags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "cms_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "cms_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          file_name: string
          folder_id: string | null
          height: number | null
          id: string
          is_public: boolean
          mime_type: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name: string
          folder_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      collaborator_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          collaborator_code: string | null
          collaborator_id: string
          commission_amount: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_revenue: number
          order_title: string | null
          paid_at: string | null
          paid_by: string | null
          payment_reference: string | null
          program_type: string | null
          status: string
          student_profile_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          collaborator_code?: string | null
          collaborator_id: string
          commission_amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_revenue?: number
          order_title?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          program_type?: string | null
          status?: string
          student_profile_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          collaborator_code?: string | null
          collaborator_id?: string
          commission_amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_revenue?: number
          order_title?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          program_type?: string | null
          status?: string
          student_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_commissions_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_commissions_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          campaign_code: string | null
          claim_deadline: string | null
          claimed_at: string | null
          conversation_id: string | null
          created_at: string
          email: string | null
          full_name: string
          hidden_at: string | null
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          market: string | null
          message: string | null
          phone: string
          program: string
          reassign_count: number
          source: string
          status: string
          student_profile_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          campaign_code?: string | null
          claim_deadline?: string | null
          claimed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          hidden_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          market?: string | null
          message?: string | null
          phone: string
          program: string
          reassign_count?: number
          source?: string
          status?: string
          student_profile_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          campaign_code?: string | null
          claim_deadline?: string | null
          claimed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          hidden_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          market?: string | null
          message?: string | null
          phone?: string
          program?: string
          reassign_count?: number
          source?: string
          status?: string
          student_profile_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_coupons: {
        Row: {
          code: string
          course_id: string | null
          created_at: string
          discount_type: string
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          uses: number
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_from?: string | null
          valid_to?: string | null
          value: number
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          meta: Json
          order_id: string | null
          price_paid_vnd: number
          progress_percent: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          meta?: Json
          order_id?: string | null
          price_paid_vnd?: number
          progress_percent?: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          meta?: Json
          order_id?: string | null
          price_paid_vnd?: number
          progress_percent?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_progress: {
        Row: {
          completed_at: string | null
          completion_note: string | null
          completion_score: number | null
          course_id: string
          id: string
          last_position: number
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          completed_at?: string | null
          completion_note?: string | null
          completion_score?: number | null
          course_id: string
          id?: string
          last_position?: number
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          completed_at?: string | null
          completion_note?: string | null
          completion_score?: number | null
          course_id?: string
          id?: string
          last_position?: number
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          attachments: Json
          content_md: string | null
          course_id: string
          created_at: string
          duration_seconds: number
          free_resources: Json
          id: string
          is_preview: boolean
          min_watch_seconds: number
          module_id: string
          order_index: number
          quiz_id: string | null
          title: string
          type: Database["public"]["Enums"]["course_lesson_type"]
          updated_at: string
          video_id: string | null
          video_provider:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json
          content_md?: string | null
          course_id: string
          created_at?: string
          duration_seconds?: number
          free_resources?: Json
          id?: string
          is_preview?: boolean
          min_watch_seconds?: number
          module_id: string
          order_index?: number
          quiz_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["course_lesson_type"]
          updated_at?: string
          video_id?: string | null
          video_provider?:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json
          content_md?: string | null
          course_id?: string
          created_at?: string
          duration_seconds?: number
          free_resources?: Json
          id?: string
          is_preview?: boolean
          min_watch_seconds?: number
          module_id?: string
          order_index?: number
          quiz_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["course_lesson_type"]
          updated_at?: string
          video_id?: string | null
          video_provider?:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_order_items: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_id: string
          price_vnd: number
          qty: number
          title_snapshot: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_id: string
          price_vnd: number
          qty?: number
          title_snapshot: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_id?: string
          price_vnd?: number
          qty?: number
          title_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "course_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      course_orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_vnd: number
          id: string
          last_reminder_at: string | null
          order_no: string
          paid_at: string | null
          payment_payload: Json
          payment_provider: Database["public"]["Enums"]["course_payment_provider"]
          payment_ref: string | null
          reminder_count: number
          status: Database["public"]["Enums"]["course_order_status"]
          subtotal_vnd: number
          total_vnd: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_vnd?: number
          id?: string
          last_reminder_at?: string | null
          order_no: string
          paid_at?: string | null
          payment_payload?: Json
          payment_provider?: Database["public"]["Enums"]["course_payment_provider"]
          payment_ref?: string | null
          reminder_count?: number
          status?: Database["public"]["Enums"]["course_order_status"]
          subtotal_vnd?: number
          total_vnd?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_vnd?: number
          id?: string
          last_reminder_at?: string | null
          order_no?: string
          paid_at?: string | null
          payment_payload?: Json
          payment_provider?: Database["public"]["Enums"]["course_payment_provider"]
          payment_ref?: string | null
          reminder_count?: number
          status?: Database["public"]["Enums"]["course_order_status"]
          subtotal_vnd?: number
          total_vnd?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "course_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_qa: {
        Row: {
          body: string
          course_id: string
          created_at: string
          id: string
          is_instructor_answer: boolean
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          course_id: string
          created_at?: string
          id?: string
          is_instructor_answer?: boolean
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          course_id?: string
          created_at?: string
          id?: string
          is_instructor_answer?: boolean
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_qa_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_qa_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_qa_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_qa"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instructor_id: string | null
          is_free: boolean
          is_published: boolean
          language: string
          level: Database["public"]["Enums"]["course_level"]
          meta: Json
          outcomes: string[]
          price_vnd: number
          published_at: string | null
          rating_avg: number
          rating_count: number
          requirements: string[]
          sale_price_vnd: number | null
          seo: Json
          slug: string
          students_count: number
          subtitle: string | null
          tags: string[]
          target_audience: string[]
          title: string
          total_lessons: number
          total_minutes: number
          trailer_provider:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          trailer_video_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean
          is_published?: boolean
          language?: string
          level?: Database["public"]["Enums"]["course_level"]
          meta?: Json
          outcomes?: string[]
          price_vnd?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          requirements?: string[]
          sale_price_vnd?: number | null
          seo?: Json
          slug: string
          students_count?: number
          subtitle?: string | null
          tags?: string[]
          target_audience?: string[]
          title: string
          total_lessons?: number
          total_minutes?: number
          trailer_provider?:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          trailer_video_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean
          is_published?: boolean
          language?: string
          level?: Database["public"]["Enums"]["course_level"]
          meta?: Json
          outcomes?: string[]
          price_vnd?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          requirements?: string[]
          sale_price_vnd?: number | null
          seo?: Json
          slug?: string
          students_count?: number
          subtitle?: string | null
          tags?: string[]
          target_audience?: string[]
          title?: string
          total_lessons?: number
          total_minutes?: number
          trailer_provider?:
            | Database["public"]["Enums"]["course_video_provider"]
            | null
          trailer_video_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_template_items: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          lesson_no: number
          objectives: string | null
          required_types: string[]
          template_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          lesson_no: number
          objectives?: string | null
          required_types?: string[]
          template_id: string
          topic: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          lesson_no?: number
          objectives?: string | null
          required_types?: string[]
          template_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "curriculum_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          level: string
          market_code: string
          name: string
          total_lessons: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level: string
          market_code: string
          name: string
          total_lessons?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          market_code?: string
          name?: string
          total_lessons?: number
          updated_at?: string
        }
        Relationships: []
      }
      departure_batches: {
        Row: {
          created_at: string
          created_by: string | null
          destination_country: string | null
          id: string
          name: string
          note: string | null
          planned_date: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_country?: string | null
          id?: string
          name: string
          note?: string | null
          planned_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_country?: string | null
          id?: string
          name?: string
          note?: string | null
          planned_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      departure_records: {
        Row: {
          actual_departure_date: string | null
          arrival_airport: string | null
          batch_id: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          current_address: string | null
          deleted_at: string | null
          departure_airport: string | null
          destination_country: string | null
          dob: string | null
          dossier_code: string | null
          education_level: string | null
          employer_name: string | null
          ethnic_minority: boolean
          ethnicity: string | null
          flight_no: string | null
          full_name: string
          gender: string
          id: string
          id_issue_date: string | null
          id_no: string
          land_lost: boolean
          marital_status: string | null
          note: string | null
          occupation: string | null
          passport_issue_date: string | null
          passport_no: string | null
          phone: string | null
          place_of_birth: string | null
          planned_departure_date: string | null
          poor_household: boolean
          program_type: string | null
          province: string | null
          religion: string | null
          status: string
          student_profile_id: string | null
          updated_at: string
          updated_by: string | null
          veteran: boolean
          ward: string | null
          worked_abroad: boolean
        }
        Insert: {
          actual_departure_date?: string | null
          arrival_airport?: string | null
          batch_id?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          deleted_at?: string | null
          departure_airport?: string | null
          destination_country?: string | null
          dob?: string | null
          dossier_code?: string | null
          education_level?: string | null
          employer_name?: string | null
          ethnic_minority?: boolean
          ethnicity?: string | null
          flight_no?: string | null
          full_name: string
          gender?: string
          id?: string
          id_issue_date?: string | null
          id_no: string
          land_lost?: boolean
          marital_status?: string | null
          note?: string | null
          occupation?: string | null
          passport_issue_date?: string | null
          passport_no?: string | null
          phone?: string | null
          place_of_birth?: string | null
          planned_departure_date?: string | null
          poor_household?: boolean
          program_type?: string | null
          province?: string | null
          religion?: string | null
          status?: string
          student_profile_id?: string | null
          updated_at?: string
          updated_by?: string | null
          veteran?: boolean
          ward?: string | null
          worked_abroad?: boolean
        }
        Update: {
          actual_departure_date?: string | null
          arrival_airport?: string | null
          batch_id?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          deleted_at?: string | null
          departure_airport?: string | null
          destination_country?: string | null
          dob?: string | null
          dossier_code?: string | null
          education_level?: string | null
          employer_name?: string | null
          ethnic_minority?: boolean
          ethnicity?: string | null
          flight_no?: string | null
          full_name?: string
          gender?: string
          id?: string
          id_issue_date?: string | null
          id_no?: string
          land_lost?: boolean
          marital_status?: string | null
          note?: string | null
          occupation?: string | null
          passport_issue_date?: string | null
          passport_no?: string | null
          phone?: string | null
          place_of_birth?: string | null
          planned_departure_date?: string | null
          poor_household?: boolean
          program_type?: string | null
          province?: string | null
          religion?: string | null
          status?: string
          student_profile_id?: string | null
          updated_at?: string
          updated_by?: string | null
          veteran?: boolean
          ward?: string | null
          worked_abroad?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "departure_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "departure_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departure_records_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          intro_markdown: string
          is_active: boolean
          note: string | null
          subject: string
          template_name: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          intro_markdown?: string
          is_active?: boolean
          note?: string | null
          subject: string
          template_name: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          intro_markdown?: string
          is_active?: boolean
          note?: string | null
          subject?: string
          template_name?: string
          version?: number
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      hero_banners: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          id: string
          image_url: string
          position: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url: string
          position?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      hot_programs: {
        Row: {
          active: boolean
          badge: string | null
          created_at: string
          href: string
          icon: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          created_at?: string
          href: string
          icon?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          created_at?: string
          href?: string
          icon?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      journey_milestones: {
        Row: {
          achievements: Json
          content: string
          cover_alt: string
          cover_image: string
          created_at: string
          documents: Json
          gallery: Json
          id: string
          short_description: string
          slug: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          video_url: string | null
          year: string
        }
        Insert: {
          achievements?: Json
          content?: string
          cover_alt?: string
          cover_image?: string
          created_at?: string
          documents?: Json
          gallery?: Json
          id?: string
          short_description?: string
          slug: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
          year: string
        }
        Update: {
          achievements?: Json
          content?: string
          cover_alt?: string
          cover_image?: string
          created_at?: string
          documents?: Json
          gallery?: Json
          id?: string
          short_description?: string
          slug?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          year?: string
        }
        Relationships: []
      }
      kpi_targets: {
        Row: {
          actual: number
          auto_source: string | null
          bonus_amount: number
          created_at: string
          id: string
          metric: string
          period: string
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual?: number
          auto_source?: string | null
          bonus_amount?: number
          created_at?: string
          id?: string
          metric: string
          period: string
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual?: number
          auto_source?: string | null
          bonus_amount?: number
          created_at?: string
          id?: string
          metric?: string
          period?: string
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_assignment_logs: {
        Row: {
          action: string
          actor: string | null
          consultation_id: string
          created_at: string
          from_user: string | null
          id: string
          reason: string | null
          to_user: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          consultation_id: string
          created_at?: string
          from_user?: string | null
          id?: string
          reason?: string | null
          to_user?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          consultation_id?: string
          created_at?: string
          from_user?: string | null
          id?: string
          reason?: string | null
          to_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_logs_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          category: string | null
          change_note: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          curriculum_slot_id: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean
          lesson_no: number | null
          market_code: string | null
          material_type: string
          pdf_companion_path: string | null
          program_id: string | null
          rejection_reason: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          change_note?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          curriculum_slot_id?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean
          lesson_no?: number | null
          market_code?: string | null
          material_type?: string
          pdf_companion_path?: string | null
          program_id?: string | null
          rejection_reason?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          change_note?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          curriculum_slot_id?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean
          lesson_no?: number | null
          market_code?: string | null
          material_type?: string
          pdf_companion_path?: string | null
          program_id?: string | null
          rejection_reason?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_materials_curriculum_slot_fk"
            columns: ["curriculum_slot_id"]
            isOneToOne: false
            referencedRelation: "curriculum_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_materials_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          annual_days: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          annual_days?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          annual_days?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          days: number
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: number
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          lesson_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lesson_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          class_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          free_resources: Json
          id: string
          order_index: number
          program_id: string | null
          status: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          class_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          free_resources?: Json
          id?: string
          order_index?: number
          program_id?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          class_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          free_resources?: Json
          id?: string
          order_index?: number
          program_id?: string | null
          status?: Database["public"]["Enums"]["lesson_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          channel: string | null
          code: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          landing_path: string | null
          lead_target: number | null
          market: string | null
          name: string
          starts_at: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          budget?: number | null
          channel?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          landing_path?: string | null
          lead_target?: number | null
          market?: string | null
          name: string
          starts_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          budget?: number | null
          channel?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          landing_path?: string | null
          lead_target?: number | null
          market?: string | null
          name?: string
          starts_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      material_approval_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          material_id: string
          note: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          material_id: string
          note?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          material_id?: string
          note?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_approval_logs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "learning_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          meta: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          meta?: Json
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          meta?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_signatories: {
        Row: {
          handover_signer_user_id: string | null
          id: boolean
          orientation_approver_user_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          handover_signer_user_id?: string | null
          id?: boolean
          orientation_approver_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          handover_signer_user_id?: string | null
          id?: boolean
          orientation_approver_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      orientation_catalog_items: {
        Row: {
          created_at: string
          credential: string | null
          description: string | null
          hours: number | null
          id: string
          is_active: boolean
          kind: string
          market_code: string | null
          name: string
          sort_order: number
          teacher_id: string | null
          threshold: number | null
          trainer_type: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential?: string | null
          description?: string | null
          hours?: number | null
          id?: string
          is_active?: boolean
          kind: string
          market_code?: string | null
          name: string
          sort_order?: number
          teacher_id?: string | null
          threshold?: number | null
          trainer_type?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential?: string | null
          description?: string | null
          hours?: number | null
          id?: string
          is_active?: boolean
          kind?: string
          market_code?: string | null
          name?: string
          sort_order?: number
          teacher_id?: string | null
          threshold?: number | null
          trainer_type?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orientation_catalog_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      orientation_certificate_counters: {
        Row: {
          last_no: number
          market_code: string
          year: number
        }
        Insert: {
          last_no?: number
          market_code: string
          year: number
        }
        Update: {
          last_no?: number
          market_code?: string
          year?: number
        }
        Relationships: []
      }
      page_banners: {
        Row: {
          badge_icon: string | null
          badge_label: string | null
          created_at: string
          cta_primary_href: string | null
          cta_primary_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          description: string | null
          eyebrow: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          layout: string
          overlay: string
          page_key: string
          stats: Json
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge_icon?: string | null
          badge_label?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label: string
          layout?: string
          overlay?: string
          page_key: string
          stats?: Json
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge_icon?: string | null
          badge_label?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          layout?: string
          overlay?: string
          page_key?: string
          stats?: Json
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          allowance: number
          approved_at: string | null
          approved_by: string | null
          base_salary: number
          created_at: string
          deductions: number
          dependents: number
          gross_pay: number
          id: string
          insurance: number
          kpi_bonus: number
          net_pay: number
          note: string | null
          other_bonus: number
          period: string
          standard_days: number
          status: string
          tax: number
          updated_at: string
          user_id: string
          work_days: number
        }
        Insert: {
          allowance?: number
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number
          created_at?: string
          deductions?: number
          dependents?: number
          gross_pay?: number
          id?: string
          insurance?: number
          kpi_bonus?: number
          net_pay?: number
          note?: string | null
          other_bonus?: number
          period: string
          standard_days?: number
          status?: string
          tax?: number
          updated_at?: string
          user_id: string
          work_days?: number
        }
        Update: {
          allowance?: number
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number
          created_at?: string
          deductions?: number
          dependents?: number
          gross_pay?: number
          id?: string
          insurance?: number
          kpi_bonus?: number
          net_pay?: number
          note?: string | null
          other_bonus?: number
          period?: string
          standard_days?: number
          status?: string
          tax?: number
          updated_at?: string
          user_id?: string
          work_days?: number
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          full_name: string | null
          id: string
          job_title_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          full_name?: string | null
          id: string
          job_title_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          full_name?: string | null
          id?: string
          job_title_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "catalog_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "catalog_job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          selected_option_ids: string[] | null
        }
        Insert: {
          answer_text?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          selected_option_ids?: string[] | null
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          selected_option_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          graded_at: string | null
          id: string
          max_score: number | null
          meta: Json
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["quiz_attempt_status"]
          student_profile_id: string
          submitted_at: string | null
        }
        Insert: {
          attempt_number?: number
          graded_at?: string | null
          id?: string
          max_score?: number | null
          meta?: Json
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_attempt_status"]
          student_profile_id: string
          submitted_at?: string | null
        }
        Update: {
          attempt_number?: number
          graded_at?: string | null
          id?: string
          max_score?: number | null
          meta?: Json
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_attempt_status"]
          student_profile_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer_text: string | null
          created_at: string
          explanation: string | null
          id: string
          order_index: number
          points: number
          question_text: string
          question_type: Database["public"]["Enums"]["quiz_question_type"]
          quiz_id: string
        }
        Insert: {
          correct_answer_text?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["quiz_question_type"]
          quiz_id: string
        }
        Update: {
          correct_answer_text?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["quiz_question_type"]
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          lesson_id: string | null
          max_attempts: number
          passing_score: number
          program_id: string | null
          shuffle_questions: boolean
          starts_at: string | null
          status: Database["public"]["Enums"]["quiz_status"]
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          program_id?: string | null
          shuffle_questions?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["quiz_status"]
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          program_id?: string | null
          shuffle_questions?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["quiz_status"]
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      sales_agents: {
        Row: {
          claim_minutes: number
          collaborator_code: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          last_assigned_at: string | null
          markets: string[]
          max_open_leads: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claim_minutes?: number
          collaborator_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          markets?: string[]
          max_open_leads?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claim_minutes?: number
          collaborator_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          markets?: string[]
          max_open_leads?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_popups: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string
          cta_label: string
          description: string
          dismiss_hours: number
          ends_at: string | null
          id: string
          image_url: string | null
          position: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string
          cta_label?: string
          description?: string
          dismiss_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          position?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string
          cta_label?: string
          description?: string
          dismiss_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          position?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          ai_config: Json
          hr_config: Json
          id: boolean
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          ai_config?: Json
          hr_config?: Json
          id?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          ai_config?: Json
          hr_config?: Json
          id?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_contracts: {
        Row: {
          allowance: number
          base_salary: number
          contract_no: string
          contract_type: string
          created_at: string
          created_by: string | null
          end_date: string | null
          file_url: string | null
          id: string
          note: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowance?: number
          base_salary?: number
          contract_no: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowance?: number
          base_salary?: number
          contract_no?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_department_scope: {
        Row: {
          access_level: string
          created_at: string
          department_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          department_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          department_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_scope_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "catalog_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          department_id: string | null
          dob: string | null
          education_level: string | null
          id: string
          id_no: string | null
          job_title_id: string | null
          phone: string | null
          pro_certificate_du_hoc: string | null
          pro_certificate_xkld: string | null
          staff_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          dob?: string | null
          education_level?: string | null
          id?: string
          id_no?: string | null
          job_title_id?: string | null
          phone?: string | null
          pro_certificate_du_hoc?: string | null
          pro_certificate_xkld?: string | null
          staff_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          dob?: string | null
          education_level?: string | null
          id?: string
          id_no?: string | null
          job_title_id?: string | null
          phone?: string | null
          pro_certificate_du_hoc?: string | null
          pro_certificate_xkld?: string | null
          staff_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "catalog_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "catalog_job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_account_links: {
        Row: {
          created_at: string
          id: string
          linked_by: string | null
          method: string
          note: string | null
          student_profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_by?: string | null
          method?: string
          note?: string | null
          student_profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_by?: string | null
          method?: string
          note?: string | null
          student_profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_account_links_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_roles: string[]
          created_at: string
          entity: string | null
          entity_id: string | null
          field: string | null
          id: string
          meta: Json
          new_value: string | null
          note: string | null
          old_value: string | null
          source: string
          stage: string | null
          student_profile_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_roles?: string[]
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          field?: string | null
          id?: string
          meta?: Json
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          source?: string
          stage?: string | null
          student_profile_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_roles?: string[]
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          field?: string | null
          id?: string
          meta?: Json
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          source?: string
          stage?: string | null
          student_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_logs_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_archive_movements: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          from_location_id: string | null
          id: string
          note: string | null
          record_id: string
          to_location_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          from_location_id?: string | null
          id?: string
          note?: string | null
          record_id: string
          to_location_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          from_location_id?: string | null
          id?: string
          note?: string | null
          record_id?: string
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_archive_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "archive_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_archive_movements_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "student_archive_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_archive_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "archive_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_archive_records: {
        Row: {
          borrowed_at: string | null
          borrower_name: string | null
          condition: string | null
          created_at: string
          doc_kind: string | null
          due_date: string | null
          id: string
          item_code: string | null
          location_id: string | null
          note: string | null
          quantity: number
          returned_at: string | null
          status: string
          stored_at: string
          stored_by: string | null
          stored_by_email: string | null
          student_profile_id: string
          title: string
          updated_at: string
        }
        Insert: {
          borrowed_at?: string | null
          borrower_name?: string | null
          condition?: string | null
          created_at?: string
          doc_kind?: string | null
          due_date?: string | null
          id?: string
          item_code?: string | null
          location_id?: string | null
          note?: string | null
          quantity?: number
          returned_at?: string | null
          status?: string
          stored_at?: string
          stored_by?: string | null
          stored_by_email?: string | null
          student_profile_id: string
          title: string
          updated_at?: string
        }
        Update: {
          borrowed_at?: string | null
          borrower_name?: string | null
          condition?: string | null
          created_at?: string
          doc_kind?: string | null
          due_date?: string | null
          id?: string
          item_code?: string | null
          location_id?: string | null
          note?: string | null
          quantity?: number
          returned_at?: string | null
          status?: string
          stored_at?: string
          stored_by?: string | null
          stored_by_email?: string | null
          student_profile_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_archive_records_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "archive_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_archive_records_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_care_logs: {
        Row: {
          actor_id: string | null
          channel: string
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          student_profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actor_id?: string | null
          channel: string
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          student_profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actor_id?: string | null
          channel?: string
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          student_profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_care_logs_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_conduct_records: {
        Row: {
          auto_generated: boolean
          class_id: string | null
          created_at: string
          created_by: string | null
          detail: string | null
          id: string
          record_type: string
          severity: string
          student_profile_id: string
          title: string
        }
        Insert: {
          auto_generated?: boolean
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          id?: string
          record_type?: string
          severity?: string
          student_profile_id: string
          title: string
        }
        Update: {
          auto_generated?: boolean
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          id?: string
          record_type?: string
          severity?: string
          student_profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_conduct_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_conduct_records_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_document_checklist: {
        Row: {
          created_at: string
          doc_code: string
          doc_name: string
          document_id: string | null
          due_date: string | null
          hard_copy_received: boolean
          id: string
          is_required: boolean
          market: string | null
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sort_order: number
          stage: string
          status: string
          student_profile_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          doc_code: string
          doc_name: string
          document_id?: string | null
          due_date?: string | null
          hard_copy_received?: boolean
          id?: string
          is_required?: boolean
          market?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          stage?: string
          status?: string
          student_profile_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          doc_code?: string
          doc_name?: string
          document_id?: string | null
          due_date?: string | null
          hard_copy_received?: boolean
          id?: string
          is_required?: boolean
          market?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          stage?: string
          status?: string
          student_profile_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_document_checklist_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_document_checklist_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doc_type: string
          file_name: string | null
          file_path: string
          id: string
          mime_type: string | null
          note: string | null
          size_bytes: number | null
          student_profile_id: string
          updated_at: string
          updated_by: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doc_type: string
          file_name?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          note?: string | null
          size_bytes?: number | null
          student_profile_id: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doc_type?: string
          file_name?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          note?: string | null
          size_bytes?: number | null
          student_profile_id?: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_dossier_reviews: {
        Row: {
          completeness_percent: number
          created_at: string
          created_by: string | null
          id: string
          issues: Json
          market: string | null
          model: string | null
          risk_level: string
          student_profile_id: string
          suggestions: Json
          summary: string | null
          visa_score: number
        }
        Insert: {
          completeness_percent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: Json
          market?: string | null
          model?: string | null
          risk_level?: string
          student_profile_id: string
          suggestions?: Json
          summary?: string | null
          visa_score?: number
        }
        Update: {
          completeness_percent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: Json
          market?: string | null
          model?: string | null
          risk_level?: string
          student_profile_id?: string
          suggestions?: Json
          summary?: string | null
          visa_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_dossier_reviews_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_export_logs: {
        Row: {
          byte_size: number | null
          checksum: string | null
          created_at: string
          exported_by: string | null
          exported_by_email: string | null
          file_name: string
          format: string
          id: string
          note: string | null
          purpose: string
          student_profile_id: string
        }
        Insert: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          exported_by?: string | null
          exported_by_email?: string | null
          file_name: string
          format: string
          id?: string
          note?: string | null
          purpose: string
          student_profile_id: string
        }
        Update: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          exported_by?: string | null
          exported_by_email?: string | null
          file_name?: string
          format?: string
          id?: string
          note?: string | null
          purpose?: string
          student_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_export_logs_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          assigned_to: string | null
          collaborator_code: string | null
          collaborator_id: string | null
          consultation_id: string | null
          contract_alert_sent: Json
          contract_duration_months: number | null
          contract_end_date: string | null
          contract_renewal_note: string | null
          contract_start_date: string | null
          contract_status: string | null
          country: string | null
          created_at: string
          created_by: string | null
          current_address_detail: string | null
          current_province_code: string | null
          current_province_name: string | null
          current_status: string
          current_ward_code: string | null
          current_ward_name: string | null
          deleted_at: string | null
          department_id: string | null
          departure_date: string | null
          departure_status: string | null
          destination_city: string | null
          destination_country: string | null
          dob: string | null
          email: string | null
          employer_contact_email: string | null
          employer_contact_name: string | null
          employer_contact_phone: string | null
          employer_name: string | null
          full_name: string
          gender: string | null
          id: string
          id_expiry_date: string | null
          id_issue_date: string | null
          id_issue_place: string | null
          id_no: string | null
          id_type: string | null
          job_title: string | null
          meta: Json
          nationality: string | null
          occupation: string | null
          ocr_at: string | null
          ocr_raw: Json | null
          origin_address_detail: string | null
          origin_province_code: string | null
          origin_province_name: string | null
          origin_ward_code: string | null
          origin_ward_name: string | null
          phone: string | null
          place_of_origin: string | null
          place_of_residence: string | null
          post_departure_status: string | null
          program: string | null
          program_type: string | null
          residence_address_detail: string | null
          residence_province_code: string | null
          residence_province_name: string | null
          residence_ward_code: string | null
          residence_ward_name: string | null
          source: string | null
          student_code: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
          visa_status: string | null
          work_address: string | null
        }
        Insert: {
          assigned_to?: string | null
          collaborator_code?: string | null
          collaborator_id?: string | null
          consultation_id?: string | null
          contract_alert_sent?: Json
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_renewal_note?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_address_detail?: string | null
          current_province_code?: string | null
          current_province_name?: string | null
          current_status?: string
          current_ward_code?: string | null
          current_ward_name?: string | null
          deleted_at?: string | null
          department_id?: string | null
          departure_date?: string | null
          departure_status?: string | null
          destination_city?: string | null
          destination_country?: string | null
          dob?: string | null
          email?: string | null
          employer_contact_email?: string | null
          employer_contact_name?: string | null
          employer_contact_phone?: string | null
          employer_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          id_expiry_date?: string | null
          id_issue_date?: string | null
          id_issue_place?: string | null
          id_no?: string | null
          id_type?: string | null
          job_title?: string | null
          meta?: Json
          nationality?: string | null
          occupation?: string | null
          ocr_at?: string | null
          ocr_raw?: Json | null
          origin_address_detail?: string | null
          origin_province_code?: string | null
          origin_province_name?: string | null
          origin_ward_code?: string | null
          origin_ward_name?: string | null
          phone?: string | null
          place_of_origin?: string | null
          place_of_residence?: string | null
          post_departure_status?: string | null
          program?: string | null
          program_type?: string | null
          residence_address_detail?: string | null
          residence_province_code?: string | null
          residence_province_name?: string | null
          residence_ward_code?: string | null
          residence_ward_name?: string | null
          source?: string | null
          student_code?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          visa_status?: string | null
          work_address?: string | null
        }
        Update: {
          assigned_to?: string | null
          collaborator_code?: string | null
          collaborator_id?: string | null
          consultation_id?: string | null
          contract_alert_sent?: Json
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_renewal_note?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_address_detail?: string | null
          current_province_code?: string | null
          current_province_name?: string | null
          current_status?: string
          current_ward_code?: string | null
          current_ward_name?: string | null
          deleted_at?: string | null
          department_id?: string | null
          departure_date?: string | null
          departure_status?: string | null
          destination_city?: string | null
          destination_country?: string | null
          dob?: string | null
          email?: string | null
          employer_contact_email?: string | null
          employer_contact_name?: string | null
          employer_contact_phone?: string | null
          employer_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_expiry_date?: string | null
          id_issue_date?: string | null
          id_issue_place?: string | null
          id_no?: string | null
          id_type?: string | null
          job_title?: string | null
          meta?: Json
          nationality?: string | null
          occupation?: string | null
          ocr_at?: string | null
          ocr_raw?: Json | null
          origin_address_detail?: string | null
          origin_province_code?: string | null
          origin_province_name?: string | null
          origin_ward_code?: string | null
          origin_ward_name?: string | null
          phone?: string | null
          place_of_origin?: string | null
          place_of_residence?: string | null
          post_departure_status?: string | null
          program?: string | null
          program_type?: string | null
          residence_address_detail?: string | null
          residence_province_code?: string | null
          residence_province_name?: string | null
          residence_ward_code?: string | null
          residence_ward_name?: string | null
          source?: string | null
          student_code?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          visa_status?: string | null
          work_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "catalog_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reviews: {
        Row: {
          attendance_score: number | null
          attitude_score: number | null
          class_id: string | null
          comment: string | null
          created_at: string
          id: string
          overall_score: number | null
          period_end: string | null
          period_label: string
          period_start: string | null
          period_type: string
          progress_score: number | null
          recommendation: string | null
          speaking_score: number | null
          student_profile_id: string
          teacher_user_id: string | null
          updated_at: string
        }
        Insert: {
          attendance_score?: number | null
          attitude_score?: number | null
          class_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          overall_score?: number | null
          period_end?: string | null
          period_label: string
          period_start?: string | null
          period_type?: string
          progress_score?: number | null
          recommendation?: string | null
          speaking_score?: number | null
          student_profile_id: string
          teacher_user_id?: string | null
          updated_at?: string
        }
        Update: {
          attendance_score?: number | null
          attitude_score?: number | null
          class_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          overall_score?: number | null
          period_end?: string | null
          period_label?: string
          period_start?: string | null
          period_type?: string
          progress_score?: number | null
          recommendation?: string | null
          speaking_score?: number | null
          student_profile_id?: string
          teacher_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_reviews_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reviews_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_history: {
        Row: {
          actor_id: string | null
          attachment_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          from_status: string | null
          id: string
          note: string | null
          student_profile_id: string
          to_status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actor_id?: string | null
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          student_profile_id: string
          to_status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actor_id?: string | null
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          student_profile_id?: string
          to_status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_status_history_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      teacher_documents: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          expires_at: string | null
          file_name: string | null
          file_path: string
          id: string
          issued_at: string | null
          mime_type: string | null
          note: string | null
          size_bytes: number | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expires_at?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          note?: string | null
          size_bytes?: number | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expires_at?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          note?: string | null
          size_bytes?: number | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_long: string | null
          created_at: string
          email: string | null
          expertise: string[]
          full_name: string
          id: string
          is_active: boolean
          is_online_instructor: boolean
          markets: string[]
          meta: Json
          phone: string | null
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_long?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[]
          full_name: string
          id?: string
          is_active?: boolean
          is_online_instructor?: boolean
          markets?: string[]
          meta?: Json
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_long?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[]
          full_name?: string
          id?: string
          is_active?: boolean
          is_online_instructor?: boolean
          markets?: string[]
          meta?: Json
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          check_in_at: string | null
          check_in_method: string
          created_at: string
          device_info: Json | null
          enrollment_id: string
          id: string
          note: string | null
          pending: boolean
          recorded_by: string | null
          session_id: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          check_in_at?: string | null
          check_in_method?: string
          created_at?: string
          device_info?: Json | null
          enrollment_id: string
          id?: string
          note?: string | null
          pending?: boolean
          recorded_by?: string | null
          session_id: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          check_in_at?: string | null
          check_in_method?: string
          created_at?: string
          device_info?: Json | null
          enrollment_id?: string
          id?: string
          note?: string | null
          pending?: boolean
          recorded_by?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_classes: {
        Row: {
          code: string
          cohort: string | null
          created_at: string
          end_date: string | null
          id: string
          market: string | null
          max_students: number | null
          meta: Json | null
          name: string
          program_id: string
          room: string | null
          schedule: string | null
          start_date: string | null
          status: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          cohort?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          market?: string | null
          max_students?: number | null
          meta?: Json | null
          name: string
          program_id: string
          room?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          cohort?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          market?: string | null
          max_students?: number | null
          meta?: Json | null
          name?: string
          program_id?: string
          room?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_classes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          certificate_url: string | null
          class_id: string
          created_at: string
          enrolled_at: string
          final_grade: number | null
          id: string
          note: string | null
          status: string
          student_profile_id: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          class_id: string
          created_at?: string
          enrolled_at?: string
          final_grade?: number | null
          id?: string
          note?: string | null
          status?: string
          student_profile_id: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          class_id?: string
          created_at?: string
          enrolled_at?: string
          final_grade?: number | null
          id?: string
          note?: string | null
          status?: string
          student_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_grades: {
        Row: {
          assessed_at: string | null
          assessment_type: string
          comment: string | null
          created_at: string
          enrollment_id: string
          graded_by: string | null
          id: string
          max_score: number | null
          score: number | null
          title: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          assessed_at?: string | null
          assessment_type: string
          comment?: string | null
          created_at?: string
          enrollment_id: string
          graded_by?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          title?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          assessed_at?: string | null
          assessment_type?: string
          comment?: string | null
          created_at?: string
          enrollment_id?: string
          graded_by?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          title?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_grades_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          code: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          level: string | null
          market: string | null
          meta: Json | null
          name: string
          program_type: string | null
          total_hours: number | null
          total_sessions: number | null
          tuition_fee: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          level?: string | null
          market?: string | null
          meta?: Json | null
          name: string
          program_type?: string | null
          total_hours?: number | null
          total_sessions?: number | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          level?: string | null
          market?: string | null
          meta?: Json | null
          name?: string
          program_type?: string | null
          total_hours?: number | null
          total_sessions?: number | null
          tuition_fee?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          class_id: string
          created_at: string
          end_time: string | null
          id: string
          note: string | null
          session_date: string
          session_no: number
          start_time: string | null
          status: string
          teacher_id: string | null
          title: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          note?: string | null
          session_date: string
          session_no: number
          start_time?: string | null
          status?: string
          teacher_id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          note?: string | null
          session_date?: string
          session_no?: number
          start_time?: string | null
          status?: string
          teacher_id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "training_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          steps: Json
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          steps?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          steps?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string
          definition_id: string
          id: string
          meta: Json
          started_at: string
          status: string
          student_profile_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step: string
          definition_id: string
          id?: string
          meta?: Json
          started_at?: string
          status?: string
          student_profile_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          definition_id?: string
          id?: string
          meta?: Json
          started_at?: string
          status?: string
          student_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_logs: {
        Row: {
          actor_id: string | null
          attachment_path: string | null
          from_status: string | null
          id: string
          instance_id: string
          meta: Json
          note: string | null
          occurred_at: string
          step_key: string
          student_profile_id: string
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          attachment_path?: string | null
          from_status?: string | null
          id?: string
          instance_id: string
          meta?: Json
          note?: string | null
          occurred_at?: string
          step_key: string
          student_profile_id: string
          to_status: string
        }
        Update: {
          actor_id?: string | null
          attachment_path?: string | null
          from_status?: string | null
          id?: string
          instance_id?: string
          meta?: Json
          note?: string | null
          occurred_at?: string
          step_key?: string
          student_profile_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_logs_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_student_department: {
        Args: {
          _department_id: string
          _student_user_id?: string
          _user_id: string
          _write?: boolean
        }
        Returns: boolean
      }
      can_access_student_record: {
        Args: { _student_id: string; _user_id: string; _write?: boolean }
        Returns: boolean
      }
      gen_departure_dossier_code: {
        Args: { _contract_type: string; _market: string }
        Returns: string
      }
      gen_departure_dossier_code_v2: {
        Args: {
          _contract_type: string
          _market: string
          _program_type: string
          _ref_date?: string
        }
        Returns: string
      }
      gen_student_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      market_short_code: { Args: { _market: string }; Returns: string }
      notify_contract_expiry: { Args: never; Returns: number }
      sync_student_checklist: {
        Args: { _student_profile_id: string }
        Returns: number
      }
      unaccent_simple: { Args: { _t: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "training_manager"
        | "teacher"
        | "consultant"
        | "visa_officer"
        | "departure_coordinator"
        | "cskh"
        | "student"
        | "training_staff"
        | "content"
        | "seo"
        | "marketing"
        | "contributor"
        | "course_instructor"
        | "sales"
        | "market_head"
      certificate_status: "issued" | "revoked" | "expired"
      chatbot_category:
        | "du_hoc"
        | "xkld"
        | "ngoai_ngu"
        | "outsourcing"
        | "cong_ty"
        | "phap_ly"
        | "khac"
      chatbot_kb_status: "draft" | "pending" | "approved" | "archived"
      course_lesson_type: "video" | "text" | "quiz" | "assignment"
      course_level:
        | "beginner"
        | "elementary"
        | "intermediate"
        | "upper"
        | "advanced"
        | "all"
      course_order_status:
        | "pending"
        | "paid"
        | "cancelled"
        | "refunded"
        | "failed"
      course_payment_provider: "pay2s" | "momo" | "zalopay" | "manual" | "free"
      course_video_provider: "youtube" | "vimeo" | "bunny" | "upload"
      lesson_status: "draft" | "published" | "archived"
      quiz_attempt_status: "in_progress" | "submitted" | "graded"
      quiz_question_type:
        | "single_choice"
        | "multiple_choice"
        | "true_false"
        | "short_answer"
      quiz_status: "draft" | "published" | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "editor",
        "training_manager",
        "teacher",
        "consultant",
        "visa_officer",
        "departure_coordinator",
        "cskh",
        "student",
        "training_staff",
        "content",
        "seo",
        "marketing",
        "contributor",
        "course_instructor",
        "sales",
        "market_head",
      ],
      certificate_status: ["issued", "revoked", "expired"],
      chatbot_category: [
        "du_hoc",
        "xkld",
        "ngoai_ngu",
        "outsourcing",
        "cong_ty",
        "phap_ly",
        "khac",
      ],
      chatbot_kb_status: ["draft", "pending", "approved", "archived"],
      course_lesson_type: ["video", "text", "quiz", "assignment"],
      course_level: [
        "beginner",
        "elementary",
        "intermediate",
        "upper",
        "advanced",
        "all",
      ],
      course_order_status: [
        "pending",
        "paid",
        "cancelled",
        "refunded",
        "failed",
      ],
      course_payment_provider: ["pay2s", "momo", "zalopay", "manual", "free"],
      course_video_provider: ["youtube", "vimeo", "bunny", "upload"],
      lesson_status: ["draft", "published", "archived"],
      quiz_attempt_status: ["in_progress", "submitted", "graded"],
      quiz_question_type: [
        "single_choice",
        "multiple_choice",
        "true_false",
        "short_answer",
      ],
      quiz_status: ["draft", "published", "closed"],
    },
  },
} as const
