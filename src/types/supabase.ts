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
    };
    Enums: {
      app_role: AppRole;
      onboarding_status: OnboardingStatus;
    };
  };
}
