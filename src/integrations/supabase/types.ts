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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      equipamentos: {
        Row: {
          capacidade_litros: number
          com_reboque: boolean
          conjunto_pesado: boolean
          created_at: string
          custo_por_km: number
          diaria: number
          id: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidade_litros: number
          com_reboque?: boolean
          conjunto_pesado?: boolean
          created_at?: string
          custo_por_km: number
          diaria: number
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidade_litros?: number
          com_reboque?: boolean
          conjunto_pesado?: boolean
          created_at?: string
          custo_por_km?: number
          diaria?: number
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      etapas_rota: {
        Row: {
          atividade: string | null
          created_at: string
          descricao: string | null
          dt_hora: string | null
          id: string
          km_etapa: number | null
          latitude: number | null
          longitude: number | null
          matricula: string | null
          ordem: number | null
          rota_id: string
          user_id: string
          veiculo: string | null
          volume: number | null
        }
        Insert: {
          atividade?: string | null
          created_at?: string
          descricao?: string | null
          dt_hora?: string | null
          id?: string
          km_etapa?: number | null
          latitude?: number | null
          longitude?: number | null
          matricula?: string | null
          ordem?: number | null
          rota_id: string
          user_id: string
          veiculo?: string | null
          volume?: number | null
        }
        Update: {
          atividade?: string | null
          created_at?: string
          descricao?: string | null
          dt_hora?: string | null
          id?: string
          km_etapa?: number | null
          latitude?: number | null
          longitude?: number | null
          matricula?: string | null
          ordem?: number | null
          rota_id?: string
          user_id?: string
          veiculo?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_rota_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
        ]
      }
      importacoes: {
        Row: {
          avisos: Json
          created_at: string
          id: string
          linhas: number
          nome_arquivo: string
          tipo_arquivo: string
          unidade: string | null
          user_id: string
        }
        Insert: {
          avisos?: Json
          created_at?: string
          id?: string
          linhas?: number
          nome_arquivo: string
          tipo_arquivo: string
          unidade?: string | null
          user_id: string
        }
        Update: {
          avisos?: Json
          created_at?: string
          id?: string
          linhas?: number
          nome_arquivo?: string
          tipo_arquivo?: string
          unidade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      produtores_rota: {
        Row: {
          codigo: string
          cooperativa: string | null
          created_at: string
          dt_coleta: string | null
          id: string
          linha: string | null
          matricula: string | null
          nome: string | null
          posicao: number | null
          rota_id: string
          tempo_coleta: string | null
          user_id: string
          volume_coleta: number
        }
        Insert: {
          codigo: string
          cooperativa?: string | null
          created_at?: string
          dt_coleta?: string | null
          id?: string
          linha?: string | null
          matricula?: string | null
          nome?: string | null
          posicao?: number | null
          rota_id: string
          tempo_coleta?: string | null
          user_id: string
          volume_coleta?: number
        }
        Update: {
          codigo?: string
          cooperativa?: string | null
          created_at?: string
          dt_coleta?: string | null
          id?: string
          linha?: string | null
          matricula?: string | null
          nome?: string | null
          posicao?: number | null
          rota_id?: string
          tempo_coleta?: string | null
          user_id?: string
          volume_coleta?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtores_rota_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotas: {
        Row: {
          ciclo: string | null
          codigo: string
          created_at: string
          custo_por_litro: number | null
          custo_total: number | null
          data_execucao: string | null
          hr_balanza: string | null
          hr_inicio_rota: string | null
          id: string
          jornada_minutos: number | null
          jornada_trechos: Json
          km_total: number
          local_descarga: string | null
          regiao: string | null
          sufixo: string
          unidade: string | null
          updated_at: string
          user_id: string
          veiculo: string | null
          veiculo_capacidade_nominal: number | null
          veiculo_equipamento: string | null
          veiculo_tipo_sigla: string | null
          veiculo_transportadora: string | null
          veiculo_unidade: string | null
          volume_total: number
        }
        Insert: {
          ciclo?: string | null
          codigo: string
          created_at?: string
          custo_por_litro?: number | null
          custo_total?: number | null
          data_execucao?: string | null
          hr_balanza?: string | null
          hr_inicio_rota?: string | null
          id?: string
          jornada_minutos?: number | null
          jornada_trechos?: Json
          km_total?: number
          local_descarga?: string | null
          regiao?: string | null
          sufixo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          veiculo?: string | null
          veiculo_capacidade_nominal?: number | null
          veiculo_equipamento?: string | null
          veiculo_tipo_sigla?: string | null
          veiculo_transportadora?: string | null
          veiculo_unidade?: string | null
          volume_total?: number
        }
        Update: {
          ciclo?: string | null
          codigo?: string
          created_at?: string
          custo_por_litro?: number | null
          custo_total?: number | null
          data_execucao?: string | null
          hr_balanza?: string | null
          hr_inicio_rota?: string | null
          id?: string
          jornada_minutos?: number | null
          jornada_trechos?: Json
          km_total?: number
          local_descarga?: string | null
          regiao?: string | null
          sufixo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          veiculo?: string | null
          veiculo_capacidade_nominal?: number | null
          veiculo_equipamento?: string | null
          veiculo_tipo_sigla?: string | null
          veiculo_transportadora?: string | null
          veiculo_unidade?: string | null
          volume_total?: number
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          aplicada: boolean
          aplicada_em: string | null
          aumento_km: number
          aumento_volume: number
          created_at: string
          custo_antes: number
          custo_depois: number
          custo_litro_antes: number | null
          custo_litro_depois: number | null
          equipamento_destino: string | null
          id: string
          km_antes: number
          km_depois: number
          observacao: string | null
          rota_id: string
          tipo: string
          updated_at: string
          user_id: string
          volume_antes: number
          volume_depois: number
        }
        Insert: {
          aplicada?: boolean
          aplicada_em?: string | null
          aumento_km?: number
          aumento_volume?: number
          created_at?: string
          custo_antes?: number
          custo_depois?: number
          custo_litro_antes?: number | null
          custo_litro_depois?: number | null
          equipamento_destino?: string | null
          id?: string
          km_antes?: number
          km_depois?: number
          observacao?: string | null
          rota_id: string
          tipo: string
          updated_at?: string
          user_id: string
          volume_antes?: number
          volume_depois?: number
        }
        Update: {
          aplicada?: boolean
          aplicada_em?: string | null
          aumento_km?: number
          aumento_volume?: number
          created_at?: string
          custo_antes?: number
          custo_depois?: number
          custo_litro_antes?: number | null
          custo_litro_depois?: number | null
          equipamento_destino?: string | null
          id?: string
          km_antes?: number
          km_depois?: number
          observacao?: string | null
          rota_id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          volume_antes?: number
          volume_depois?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
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
    Enums: {},
  },
} as const
