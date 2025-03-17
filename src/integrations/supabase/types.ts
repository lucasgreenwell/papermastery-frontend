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
      edges: {
        Row: {
          created_at: string | null
          edge_type: string
          graph_id: string
          id: string
          label: string | null
          metadata: Json | null
          source: string
          style: Json | null
          target: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          edge_type?: string
          graph_id: string
          id?: string
          label?: string | null
          metadata?: Json | null
          source: string
          style?: Json | null
          target: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          edge_type?: string
          graph_id?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          source?: string
          style?: Json | null
          target?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edges_graph_id_fkey"
            columns: ["graph_id"]
            isOneToOne: false
            referencedRelation: "graphs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_target_fkey"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graphs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          paper_id: string
          settings: Json | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          paper_id: string
          settings?: Json | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          paper_id?: string
          settings?: Json | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graphs_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string | null
          data: Json
          id: string
          level: string
          order: number
          paper_id: string | null
          type: string
          videos: Json | null
        }
        Insert: {
          category?: string | null
          data: Json
          id?: string
          level: string
          order: number
          paper_id?: string | null
          type: string
          videos?: Json | null
        }
        Update: {
          category?: string | null
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
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          paper_id: string | null
          sender: string
          sources: Json | null
          text: string
          user_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          paper_id?: string | null
          sender?: string
          sources?: Json | null
          text: string
          user_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          paper_id?: string | null
          sender?: string
          sources?: Json | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          graph_id: string
          id: string
          label: string
          metadata: Json | null
          node_type: string
          position: Json
          style: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          graph_id: string
          id?: string
          label: string
          metadata?: Json | null
          node_type?: string
          position?: Json
          style?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          graph_id?: string
          id?: string
          label?: string
          metadata?: Json | null
          node_type?: string
          position?: Json
          style?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nodes_graph_id_fkey"
            columns: ["graph_id"]
            isOneToOne: false
            referencedRelation: "graphs"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_requests: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string | null
          researcher_email: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          researcher_email: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          researcher_email?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_requests_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_researchers: {
        Row: {
          created_at: string | null
          is_primary: boolean | null
          paper_id: string
          researcher_id: string
        }
        Insert: {
          created_at?: string | null
          is_primary?: boolean | null
          paper_id: string
          researcher_id: string
        }
        Update: {
          created_at?: string | null
          is_primary?: boolean | null
          paper_id?: string
          researcher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_researchers_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_researchers_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract: string | null
          arxiv_id: string | null
          authors: Json
          chunk_count: number | null
          embedding_id: string | null
          error_message: string | null
          full_text: string | null
          id: string
          publication_date: string | null
          related_papers: Json | null
          related_papers_completed: boolean | null
          source_type: string
          source_url: string | null
          summaries: Json | null
          summary_completed: boolean | null
          tags: Json | null
          title: string
        }
        Insert: {
          abstract?: string | null
          arxiv_id?: string | null
          authors: Json
          chunk_count?: number | null
          embedding_id?: string | null
          error_message?: string | null
          full_text?: string | null
          id?: string
          publication_date?: string | null
          related_papers?: Json | null
          related_papers_completed?: boolean | null
          source_type?: string
          source_url?: string | null
          summaries?: Json | null
          summary_completed?: boolean | null
          tags?: Json | null
          title: string
        }
        Update: {
          abstract?: string | null
          arxiv_id?: string | null
          authors?: Json
          chunk_count?: number | null
          embedding_id?: string | null
          error_message?: string | null
          full_text?: string | null
          id?: string
          publication_date?: string | null
          related_papers?: Json | null
          related_papers_completed?: boolean | null
          source_type?: string
          source_url?: string | null
          summaries?: Json | null
          summary_completed?: boolean | null
          tags?: Json | null
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          session_id: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          session_id?: string | null
          status: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          session_id?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          completed: boolean
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_progress_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
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
      researchers: {
        Row: {
          achievements: Json | null
          additional_emails: Json | null
          availability: Json | null
          bio: string | null
          created_at: string | null
          email: string
          expertise: Json | null
          id: string
          name: string
          rate: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          achievements?: Json | null
          additional_emails?: Json | null
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          email: string
          expertise?: Json | null
          id?: string
          name: string
          rate?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          achievements?: Json | null
          additional_emails?: Json | null
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          email?: string
          expertise?: Json | null
          id?: string
          name?: string
          rate?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          researcher_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          researcher_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          researcher_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "researchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          paper_id: string | null
          researcher_id: string | null
          start_time: string
          status: string
          updated_at: string | null
          user_id: string | null
          zoom_link: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          paper_id?: string | null
          researcher_id?: string | null
          start_time: string
          status: string
          updated_at?: string | null
          user_id?: string | null
          zoom_link?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          paper_id?: string | null
          researcher_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          start_date: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_conversations: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
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
      waiting_list: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_paper_by_source: {
        Args: {
          p_source_url: string
          p_source_type: string
        }
        Returns: {
          abstract: string | null
          arxiv_id: string | null
          authors: Json
          chunk_count: number | null
          embedding_id: string | null
          error_message: string | null
          full_text: string | null
          id: string
          publication_date: string | null
          related_papers: Json | null
          related_papers_completed: boolean | null
          source_type: string
          source_url: string | null
          summaries: Json | null
          summary_completed: boolean | null
          tags: Json | null
          title: string
        }[]
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
