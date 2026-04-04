export type AppRole = 'admin_mvp' | 'admin_empresa' | 'nucleo' | 'lideranca';

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          active?: boolean;
        };
      };
    };
    Enums: {
      app_role: AppRole;
    };
  };
}
