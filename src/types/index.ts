export interface Personalidade {
  id: string;
  nome: string;
  apelido?: string;
  foto_url?: string;
  vitorias: number;
  derrotas: number;
  empates: number;
  criado_em: string;
}

export interface Discussao {
  id: string;
  titulo: string;
  descricao?: string;
  personalidade_a_id: string;
  personalidade_b_id: string;
  personalidade_a?: Personalidade;
  personalidade_b?: Personalidade;
  votos_a: number;
  votos_b: number;
  ativa: boolean;
  criado_em: string;
  encerra_em: string;
}

export interface Voto {
  id: string;
  discussao_id: string;
  personalidade_id: string;
  fingerprint: string;
  criado_em: string;
}
