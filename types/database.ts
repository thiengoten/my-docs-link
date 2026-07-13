export type ProjectStatus = "active" | "completed" | "on_hold";

export type DocType =
  | "legal"
  | "pricing"
  | "image"
  | "floor_plan"
  | "contract_template"
  | "other";

export type DocumentStatus = "active" | "superseded" | "archived";

export type Project = {
  id: string;
  name: string;
  developer: string | null;
  location: string | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  drive_file_id: string;
  drive_web_view_link: string | null;
  file_name: string;
  doc_type: DocType;
  status: DocumentStatus;
  note: string | null;
  extracted_text: string | null;
  extracted_text_raw: string | null;
  superseded_by: string | null;
  document_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareLink = {
  id: string;
  project_id: string;
  token: string;
  document_ids: string[] | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
};

export type GoogleAuthToken = {
  id: string;
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type SearchResult = {
  id: string;
  project_id: string;
  project_name: string;
  file_name: string;
  doc_type: DocType;
  status: DocumentStatus;
  note: string | null;
  document_date: string | null;
  snippet: string | null;
  rank: number;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Partial<Project> & { name: string };
        Update: Partial<Project>;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: Partial<Document> & {
          project_id: string;
          drive_file_id: string;
          file_name: string;
          doc_type: DocType;
        };
        Update: Partial<Document>;
        Relationships: [];
      };
      share_links: {
        Row: ShareLink;
        Insert: Partial<ShareLink> & { project_id: string; token: string };
        Update: Partial<ShareLink>;
        Relationships: [];
      };
      google_auth_tokens: {
        Row: GoogleAuthToken;
        Insert: Partial<GoogleAuthToken> & {
          user_id: string;
          encrypted_access_token: string;
          encrypted_refresh_token: string;
          expires_at: string;
        };
        Update: Partial<GoogleAuthToken>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_documents: {
        Args: {
          p_query?: string | null;
          p_project_id?: string | null;
          p_doc_type?: DocType | null;
          p_date_from?: string | null;
          p_date_to?: string | null;
        };
        Returns: SearchResult[];
      };
      get_share_link_by_token: {
        Args: { p_token: string };
        Returns: {
          id: string;
          project_id: string;
          document_ids: string[] | null;
          expires_at: string | null;
          revoked: boolean;
        }[];
      };
      get_shared_project: {
        Args: { p_token: string };
        Returns: {
          id: string;
          name: string;
          developer: string | null;
          location: string | null;
          status: ProjectStatus;
        }[];
      };
      get_shared_documents: {
        Args: { p_token: string };
        Returns: {
          id: string;
          project_id: string;
          drive_file_id: string;
          drive_web_view_link: string | null;
          file_name: string;
          doc_type: DocType;
          status: DocumentStatus;
          note: string | null;
          document_date: string | null;
        }[];
      };
    };
    Enums: {
      project_status: ProjectStatus;
      doc_type: DocType;
      document_status: DocumentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
