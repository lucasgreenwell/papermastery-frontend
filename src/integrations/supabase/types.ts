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
      achievements: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer: string
          id: string
          question_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          answer: string
          id?: string
          question_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          id?: string
          question_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          data: Json
          id: string
          level: string
          order: number
          paper_id: string | null
          type: string
          videos: Json | null
        }
        Insert: {
          category: string
          data: Json
          id?: string
          level: string
          order: number
          paper_id?: string | null
          type: string
          videos?: Json | null
        }
        Update: {
          category?: string
          data?: Json
          id?: string
          level?: string
          order?: number
          paper_id?: string | null
          type?: string
          videos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "items_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract: string
          arxiv_id: string
          authors: Json
          embedding_id: string | null
          full_text: string | null
          id: string
          publication_date: string
          related_papers: Json | null
          summaries: Json | null
          tags: Json | null
          title: string
        }
        Insert: {
          abstract: string
          arxiv_id: string
          authors: Json
          embedding_id?: string | null
          full_text?: string | null
          id?: string
          publication_date: string
          related_papers?: Json | null
          summaries?: Json | null
          tags?: Json | null
          title: string
        }
        Update: {
          abstract?: string
          arxiv_id?: string
          authors?: Json
          embedding_id?: string | null
          full_text?: string | null
          id?: string
          publication_date?: string
          related_papers?: Json | null
          summaries?: Json | null
          tags?: Json | null
          title?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          decision: string | null
          item_id: string
          sprt_log_likelihood_ratio: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          decision?: string | null
          item_id: string
          sprt_log_likelihood_ratio?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          decision?: string | null
          item_id?: string
          sprt_log_likelihood_ratio?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      queries: {
        Row: {
          answer_text: string | null
          id: string
          paper_id: string | null
          question_text: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          answer_text?: string | null
          id?: string
          paper_id?: string | null
          question_text: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          answer_text?: string | null
          id?: string
          paper_id?: string | null
          question_text?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queries_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices: Json | null
          correct_answer: string | null
          id: string
          item_id: string | null
          text: string
          type: string
        }
        Insert: {
          choices?: Json | null
          correct_answer?: string | null
          id?: string
          item_id?: string | null
          text: string
          type: string
        }
        Update: {
          choices?: Json | null
          correct_answer?: string | null
          id?: string
          item_id?: string | null
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      users_papers: {
        Row: {
          paper_id: string
          user_id: string
        }
        Insert: {
          paper_id: string
          user_id: string
        }
        Update: {
          paper_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_papers_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
