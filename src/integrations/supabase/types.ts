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
      clients: {
        Row: {
          adresse: string | null
          code_tva: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          code_tva?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          code_tva?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      demandes_devis: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          nom: string
          status: string
          sujet: string | null
          telephone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          nom: string
          status?: string
          sujet?: string | null
          telephone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          nom?: string
          status?: string
          sujet?: string | null
          telephone?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          client_id: string | null
          created_at: string
          date_devis: string
          id: string
          notes: string | null
          numero: string
          status: string
          total_ht: number
          total_ttc: number
          tva_pct: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_devis?: string
          id?: string
          notes?: string | null
          numero: string
          status?: string
          total_ht?: number
          total_ttc?: number
          tva_pct?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_devis?: string
          id?: string
          notes?: string | null
          numero?: string
          status?: string
          total_ht?: number
          total_ttc?: number
          tva_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      devis_items: {
        Row: {
          designation: string
          devis_id: string
          id: string
          position: number
          prix_unitaire: number
          quantite: number
          total: number
        }
        Insert: {
          designation: string
          devis_id: string
          id?: string
          position?: number
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Update: {
          designation?: string
          devis_id?: string
          id?: string
          position?: number
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_items_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      facture_items: {
        Row: {
          designation: string
          facture_id: string
          id: string
          position: number
          prix_unitaire: number
          quantite: number
          total: number
        }
        Insert: {
          designation: string
          facture_id: string
          id?: string
          position?: number
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Update: {
          designation?: string
          facture_id?: string
          id?: string
          position?: number
          prix_unitaire?: number
          quantite?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "facture_items_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          client_id: string | null
          created_at: string
          date_echeance: string | null
          date_facture: string
          devis_id: string | null
          id: string
          montant_paye: number
          notes: string | null
          numero: string
          status: string
          total_ht: number
          total_ttc: number
          tva_pct: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          devis_id?: string | null
          id?: string
          montant_paye?: number
          notes?: string | null
          numero: string
          status?: string
          total_ht?: number
          total_ttc?: number
          tva_pct?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_facture?: string
          devis_id?: string | null
          id?: string
          montant_paye?: number
          notes?: string | null
          numero?: string
          status?: string
          total_ht?: number
          total_ttc?: number
          tva_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string
          date_paiement: string
          facture_id: string
          id: string
          methode: string | null
          montant: number
          notes: string | null
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          facture_id: string
          id?: string
          methode?: string | null
          montant: number
          notes?: string | null
        }
        Update: {
          created_at?: string
          date_paiement?: string
          facture_id?: string
          id?: string
          methode?: string | null
          montant?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      realisations: {
        Row: {
          categorie: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          position: number
          titre: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          position?: number
          titre: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          categorie?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          position?: number
          titre?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
