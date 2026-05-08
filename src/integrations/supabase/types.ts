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
      assessments: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          supplier_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          supplier_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          supplier_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          content_type: string | null
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      code_review_findings: {
        Row: {
          created_at: string
          created_by: string | null
          cwe_id: string | null
          description: string | null
          file_path: string | null
          id: string
          line_number: number | null
          remediation: string | null
          review_id: string
          severity: Database["public"]["Enums"]["finding_severity"]
          status: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cwe_id?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          line_number?: number | null
          remediation?: string | null
          review_id: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cwe_id?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          line_number?: number | null
          remediation?: string | null
          review_id?: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_review_findings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "code_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      code_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          repository_url: string | null
          reviewer: string | null
          scope: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          repository_url?: string | null
          reviewer?: string | null
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          repository_url?: string | null
          reviewer?: string | null
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_controls: {
        Row: {
          control_id: string
          created_at: string
          created_by: string | null
          description: string | null
          evidence: string | null
          framework_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["control_status"]
          title: string
          updated_at: string
        }
        Insert: {
          control_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence?: string | null
          framework_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["control_status"]
          title: string
          updated_at?: string
        }
        Update: {
          control_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence?: string | null
          framework_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["control_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_frameworks: {
        Row: {
          created_at: string
          created_by: string | null
          framework_name: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["compliance_status"]
          target_date: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          framework_name: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["compliance_status"]
          target_date?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          framework_name?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["compliance_status"]
          target_date?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_frameworks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          assessment_id: string
          comment: string
          decided_at: string
          decided_by: string | null
          decision: Database["public"]["Enums"]["decision_type"]
          id: string
        }
        Insert: {
          assessment_id: string
          comment?: string
          decided_at?: string
          decided_by?: string | null
          decision: Database["public"]["Enums"]["decision_type"]
          id?: string
        }
        Update: {
          assessment_id?: string
          comment?: string
          decided_at?: string
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["decision_type"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          org_id: string | null
          project_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
          supplier_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          org_id?: string | null
          project_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          supplier_id?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          org_id?: string | null
          project_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          supplier_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pentest_engagements: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          scope: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["engagement_status"]
          tester: string | null
          title: string
          type: Database["public"]["Enums"]["engagement_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["engagement_status"]
          tester?: string | null
          title: string
          type?: Database["public"]["Enums"]["engagement_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["engagement_status"]
          tester?: string | null
          title?: string
          type?: Database["public"]["Enums"]["engagement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_engagements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_findings: {
        Row: {
          affected_asset: string | null
          created_at: string
          created_by: string | null
          cvss_score: number | null
          description: string | null
          engagement_id: string
          id: string
          remediation: string | null
          retest_status: Database["public"]["Enums"]["retest_status"] | null
          severity: Database["public"]["Enums"]["finding_severity"]
          status: Database["public"]["Enums"]["pentest_finding_status"]
          title: string
          updated_at: string
        }
        Insert: {
          affected_asset?: string | null
          created_at?: string
          created_by?: string | null
          cvss_score?: number | null
          description?: string | null
          engagement_id: string
          id?: string
          remediation?: string | null
          retest_status?: Database["public"]["Enums"]["retest_status"] | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["pentest_finding_status"]
          title: string
          updated_at?: string
        }
        Update: {
          affected_asset?: string | null
          created_at?: string
          created_by?: string | null
          cvss_score?: number | null
          description?: string | null
          engagement_id?: string
          id?: string
          remediation?: string | null
          retest_status?: Database["public"]["Enums"]["retest_status"] | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["pentest_finding_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_findings_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "pentest_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_clients: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_clients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          org_id: string
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name: string
          org_id: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          org_id?: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          id: string
          sort_order: number
          text: string
          weight: number
        }
        Insert: {
          category: string
          id: string
          sort_order?: number
          text: string
          weight: number
        }
        Update: {
          category?: string
          id?: string
          sort_order?: number
          text?: string
          weight?: number
        }
        Relationships: []
      }
      responses: {
        Row: {
          answer: Database["public"]["Enums"]["answer_value"]
          assessment_id: string
          comment: string | null
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer: Database["public"]["Enums"]["answer_value"]
          assessment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer?: Database["public"]["Enums"]["answer_value"]
          assessment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_registers: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          impact: number
          likelihood: number
          owner: string | null
          project_id: string
          risk_score: number | null
          status: Database["public"]["Enums"]["risk_register_status"]
          title: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: number
          likelihood?: number
          owner?: string | null
          project_id: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_register_status"]
          title: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: number
          likelihood?: number
          owner?: string | null
          project_id?: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["risk_register_status"]
          title?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_registers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_scores: {
        Row: {
          assessment_id: string
          computed_at: string
          id: string
          level: Database["public"]["Enums"]["risk_level"]
          score: number
        }
        Insert: {
          assessment_id: string
          computed_at?: string
          id?: string
          level: Database["public"]["Enums"]["risk_level"]
          score: number
        }
        Update: {
          assessment_id?: string
          computed_at?: string
          id?: string
          level?: Database["public"]["Enums"]["risk_level"]
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      security_requirements: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          framework: string | null
          id: string
          priority: Database["public"]["Enums"]["requirement_priority"]
          project_id: string
          reference_id: string | null
          status: Database["public"]["Enums"]["requirement_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["requirement_priority"]
          project_id: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["requirement_priority"]
          project_id?: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category: string
          contact_email: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          category?: string
          contact_email: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
          user_id?: string | null
        }
        Update: {
          category?: string
          contact_email?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_assessment: {
        Args: { _assessment: string; _user: string }
        Returns: boolean
      }
      current_role_is: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_project_access: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string; _user: string }; Returns: boolean }
      is_supplier_user: {
        Args: { _supplier: string; _user: string }
        Returns: boolean
      }
      user_can_access_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      answer_value: "yes" | "partial" | "no" | "na"
      app_role: "consultant" | "client" | "supplier"
      assessment_status:
        | "draft"
        | "sent"
        | "completed"
        | "reviewed"
        | "approved"
        | "rejected"
      compliance_status: "not_started" | "in_progress" | "ready" | "certified"
      control_status: "not_implemented" | "partial" | "implemented" | "verified"
      decision_type: "accept" | "accept_with_conditions" | "reject"
      engagement_status: "scoping" | "active" | "completed" | "reported"
      engagement_type: "pentest" | "dast" | "red_team"
      finding_severity: "critical" | "high" | "medium" | "low" | "info"
      finding_status: "open" | "confirmed" | "fixed" | "false_positive"
      invite_status: "pending" | "accepted" | "revoked"
      pentest_finding_status: "open" | "confirmed" | "remediated" | "accepted"
      project_status: "active" | "completed"
      requirement_priority: "critical" | "high" | "medium" | "low"
      requirement_status: "draft" | "approved" | "implemented" | "verified"
      retest_status: "pending" | "passed" | "failed"
      review_status: "planned" | "in_progress" | "completed"
      risk_level: "low" | "medium" | "high"
      risk_register_status: "open" | "mitigated" | "accepted" | "transferred"
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
      answer_value: ["yes", "partial", "no", "na"],
      app_role: ["consultant", "client", "supplier"],
      assessment_status: [
        "draft",
        "sent",
        "completed",
        "reviewed",
        "approved",
        "rejected",
      ],
      compliance_status: ["not_started", "in_progress", "ready", "certified"],
      control_status: ["not_implemented", "partial", "implemented", "verified"],
      decision_type: ["accept", "accept_with_conditions", "reject"],
      engagement_status: ["scoping", "active", "completed", "reported"],
      engagement_type: ["pentest", "dast", "red_team"],
      finding_severity: ["critical", "high", "medium", "low", "info"],
      finding_status: ["open", "confirmed", "fixed", "false_positive"],
      invite_status: ["pending", "accepted", "revoked"],
      pentest_finding_status: ["open", "confirmed", "remediated", "accepted"],
      project_status: ["active", "completed"],
      requirement_priority: ["critical", "high", "medium", "low"],
      requirement_status: ["draft", "approved", "implemented", "verified"],
      retest_status: ["pending", "passed", "failed"],
      review_status: ["planned", "in_progress", "completed"],
      risk_level: ["low", "medium", "high"],
      risk_register_status: ["open", "mitigated", "accepted", "transferred"],
    },
  },
} as const
