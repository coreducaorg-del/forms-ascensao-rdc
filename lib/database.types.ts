export interface Database {
  public: {
    Tables: {
      respostas: {
        Row: {
          id: string;
          criado_em: string;

          // Seção 1: Dados pessoais
          nome_completo: string;
          whatsapp: string;
          email: string;

          // Seção 2: Sobre o idioma
          nivel_coreano: string;
          coreano_no_dia_a_dia: string | null;
          motivacao: string | null;
          maior_dificuldade: string | null;
          tentou_antes: string | null;

          // Seção 3: Dados demográficos
          faixa_etaria: string | null;
          estado_civil: string | null;
          estado_civil_outro: string | null;
          tem_filhos: string | null;
          quantidade_filhos: string | null;
          tem_netos: string | null;
          quantidade_netos: string | null;
          escolaridade: string | null;
          area_formacao: string | null;
          momento_profissional: string | null;
          faixa_renda: string | null;

          // Seção 4: Prontidão
          tempo_dedicacao: string | null;
          interesse_curso_completo: string | null;
          o_que_faria_investir: string | null;
          prioridade_coreano: string | null;
          tempo_conhece_jae: string | null;
          como_conheceu_jae: string | null;
        };
        Insert: {
          id?: string;
          criado_em?: string;

          nome_completo: string;
          whatsapp: string;
          email: string;

          nivel_coreano: string;
          coreano_no_dia_a_dia?: string | null;
          motivacao?: string | null;
          maior_dificuldade?: string | null;
          tentou_antes?: string | null;

          faixa_etaria?: string | null;
          estado_civil?: string | null;
          estado_civil_outro?: string | null;
          tem_filhos?: string | null;
          quantidade_filhos?: string | null;
          tem_netos?: string | null;
          quantidade_netos?: string | null;
          escolaridade?: string | null;
          area_formacao?: string | null;
          momento_profissional?: string | null;
          faixa_renda?: string | null;

          tempo_dedicacao?: string | null;
          interesse_curso_completo?: string | null;
          o_que_faria_investir?: string | null;
          prioridade_coreano?: string | null;
          tempo_conhece_jae?: string | null;
          como_conheceu_jae?: string | null;
        };
        Update: {
          id?: string;
          criado_em?: string;

          nome_completo?: string;
          whatsapp?: string;
          email?: string;

          nivel_coreano?: string;
          coreano_no_dia_a_dia?: string | null;
          motivacao?: string | null;
          maior_dificuldade?: string | null;
          tentou_antes?: string | null;

          faixa_etaria?: string | null;
          estado_civil?: string | null;
          estado_civil_outro?: string | null;
          tem_filhos?: string | null;
          quantidade_filhos?: string | null;
          tem_netos?: string | null;
          quantidade_netos?: string | null;
          escolaridade?: string | null;
          area_formacao?: string | null;
          momento_profissional?: string | null;
          faixa_renda?: string | null;

          tempo_dedicacao?: string | null;
          interesse_curso_completo?: string | null;
          o_que_faria_investir?: string | null;
          prioridade_coreano?: string | null;
          tempo_conhece_jae?: string | null;
          como_conheceu_jae?: string | null;
        };
      };
      acessos_aula: {
        Row: {
          id: string;
          email: string;
          primeiro_acesso: string;
          data_expiracao: string | null;
          total_acessos: number;
          ultimo_acesso: string;
          tempo_maximo_assistido: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          primeiro_acesso?: string;
          data_expiracao?: string | null;
          total_acessos?: number;
          ultimo_acesso?: string;
          tempo_maximo_assistido?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          primeiro_acesso?: string;
          data_expiracao?: string | null;
          total_acessos?: number;
          ultimo_acesso?: string;
          tempo_maximo_assistido?: number | null;
        };
      };
    };
  };
}

export type Resposta = Database["public"]["Tables"]["respostas"]["Row"];
export type RespostaInsert = Database["public"]["Tables"]["respostas"]["Insert"];
export type RespostaUpdate = Database["public"]["Tables"]["respostas"]["Update"];

export type AcessoAula = Database["public"]["Tables"]["acessos_aula"]["Row"];
export type AcessoAulaInsert = Database["public"]["Tables"]["acessos_aula"]["Insert"];
export type AcessoAulaUpdate = Database["public"]["Tables"]["acessos_aula"]["Update"];
