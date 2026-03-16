export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          department: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          department?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          department?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string
          department: string
          status: string
          dev_substatus: string | null
          doc_urls: string[]
          prototype_url: string | null
          template_id: string | null
          template_responses: Record<string, string> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description: string
          department: string
          status?: string
          dev_substatus?: string | null
          doc_urls?: string[]
          prototype_url?: string | null
          template_id?: string | null
          template_responses?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          dev_substatus?: string | null
          doc_urls?: string[]
          prototype_url?: string | null
          template_id?: string | null
          template_responses?: Record<string, string> | null
          updated_at?: string
        }
        Relationships: []
      }
      idea_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          fields_json: Array<{ label: string; placeholder: string; required: boolean }>
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          fields_json?: Array<{ label: string; placeholder: string; required: boolean }>
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          fields_json?: Array<{ label: string; placeholder: string; required: boolean }>
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admin_availability: {
        Row: {
          id: string
          admin_id: string
          date: string
          start_time: string
          end_time: string
          is_booked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          date: string
          start_time: string
          end_time: string
          is_booked?: boolean
          created_at?: string
        }
        Update: {
          is_booked?: boolean
        }
        Relationships: []
      }
      mentoring_sessions: {
        Row: {
          id: string
          admin_id: string
          collaborator_id: string
          availability_id: string
          scheduled_date: string
          scheduled_start: string
          scheduled_end: string
          topic: string
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          collaborator_id: string
          availability_id: string
          scheduled_date: string
          scheduled_start: string
          scheduled_end: string
          topic: string
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          topic?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_events: {
        Row: {
          id: string
          ticket_id: string
          actor_id: string
          event_type: string
          old_value: string | null
          new_value: string | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          actor_id: string
          event_type: string
          old_value?: string | null
          new_value?: string | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          actor_id?: string
          event_type?: string
          old_value?: string | null
          new_value?: string | null
          comment?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
