export type AppRole = 'admin_mvp' | 'admin_empresa' | 'nucleo' | 'lideranca';

export type OnboardingStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
        };
        Update: {
          role?: AppRole;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          active: boolean;
          sector: string | null;
          employee_count: number | null;
          admin_name: string | null;
          admin_email: string | null;
          onboarding_status: OnboardingStatus;
          owner_email: string | null;
          owner_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          active?: boolean;
          sector?: string | null;
          employee_count?: number | null;
          admin_name?: string | null;
          admin_email?: string | null;
          onboarding_status?: OnboardingStatus;
          owner_email?: string | null;
          owner_name?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          active?: boolean;
          sector?: string | null;
          employee_count?: number | null;
          admin_name?: string | null;
          admin_email?: string | null;
          onboarding_status?: OnboardingStatus;
          owner_email?: string | null;
          owner_name?: string | null;
        };
      };
      population_members: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          email: string;
          sector: string;
          role: string;
          unit: string;
          shift: string;
          admission_date: string;
          facilitator: boolean;
          nucleo: boolean;
          leadership: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          email?: string;
          sector?: string;
          role?: string;
          unit?: string;
          shift?: string;
          admission_date?: string;
          facilitator?: boolean;
          nucleo?: boolean;
          leadership?: boolean;
          active?: boolean;
        };
        Update: {
          name?: string;
          email?: string;
          sector?: string;
          role?: string;
          unit?: string;
          shift?: string;
          admission_date?: string;
          facilitator?: boolean;
          nucleo?: boolean;
          leadership?: boolean;
          active?: boolean;
        };
      };
      turmas: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          cycle_id: string;
          facilitator: string;
          start_date: string | null;
          end_date: string | null;
          training_date: string | null;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          cycle_id: string;
          facilitator?: string;
          start_date?: string | null;
          end_date?: string | null;
          training_date?: string | null;
          status?: string;
          notes?: string;
        };
        Update: {
          name?: string;
          cycle_id?: string;
          facilitator?: string;
          start_date?: string | null;
          end_date?: string | null;
          training_date?: string | null;
          status?: string;
          notes?: string;
        };
      };
      turma_participants: {
        Row: {
          id: string;
          turma_id: string;
          member_id: string | null;
          name: string;
          sector: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id: string;
          member_id?: string | null;
          name: string;
          sector?: string;
          role?: string;
        };
        Update: {
          name?: string;
          sector?: string;
          role?: string;
        };
      };
      turma_attendance: {
        Row: {
          id: string;
          turma_id: string;
          participant_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id: string;
          participant_id: string;
          status: string;
        };
        Update: {
          status?: string;
        };
      };
      cycle_states: {
        Row: {
          id: string;
          company_id: string;
          cycle_id: string;
          closure_status: string;
          start_date: string | null;
          planned_end_date: string | null;
          closed_at: string | null;
          closure_notes: string;
          locked_for_editing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cycle_id: string;
          closure_status?: string;
          start_date?: string | null;
          planned_end_date?: string | null;
          closed_at?: string | null;
          closure_notes?: string;
          locked_for_editing?: boolean;
        };
        Update: {
          closure_status?: string;
          start_date?: string | null;
          planned_end_date?: string | null;
          closed_at?: string | null;
          closure_notes?: string;
          locked_for_editing?: boolean;
        };
      };
      cycle_actions: {
        Row: {
          id: string;
          company_id: string;
          cycle_id: string;
          factor_id: string;
          action_id: string;
          title: string;
          enabled: boolean;
          disabled_reason: string;
          responsible: string;
          due_date: string | null;
          status: string;
          observation: string;
          source_decision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cycle_id: string;
          factor_id: string;
          action_id: string;
          title?: string;
          enabled?: boolean;
          disabled_reason?: string;
          responsible?: string;
          due_date?: string | null;
          status?: string;
          observation?: string;
          source_decision_id?: string | null;
        };
        Update: {
          title?: string;
          enabled?: boolean;
          disabled_reason?: string;
          responsible?: string;
          due_date?: string | null;
          status?: string;
          observation?: string;
          source_decision_id?: string | null;
        };
      };
      records: {
        Row: {
          id: string;
          company_id: string;
          date: string;
          cycle_id: string | null;
          factor_id: string | null;
          type: string;
          status: string;
          title: string;
          description: string;
          owner: string;
          tags: string[];
          creates_actions: boolean;
          linked_action_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          date: string;
          cycle_id?: string | null;
          factor_id?: string | null;
          type: string;
          status?: string;
          title: string;
          description?: string;
          owner?: string;
          tags?: string[];
          creates_actions?: boolean;
          linked_action_ids?: string[];
        };
        Update: {
          date?: string;
          cycle_id?: string | null;
          factor_id?: string | null;
          type?: string;
          status?: string;
          title?: string;
          description?: string;
          owner?: string;
          tags?: string[];
          creates_actions?: boolean;
          linked_action_ids?: string[];
        };
      };
      success_factor_overrides: {
        Row: {
          id: string;
          cycle_id: string;
          factor_id: string;
          actions: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cycle_id: string;
          factor_id: string;
          actions: any;
        };
        Update: {
          actions?: any;
        };
      };
      org_structure: {
        Row: {
          id: string;
          company_id: string;
          type: string;
          name: string;
          archived: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type: string;
          name: string;
          archived?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          archived?: boolean;
          sort_order?: number;
        };
      };
    };
    Enums: {
      app_role: AppRole;
      onboarding_status: OnboardingStatus;
    };
  };
}
