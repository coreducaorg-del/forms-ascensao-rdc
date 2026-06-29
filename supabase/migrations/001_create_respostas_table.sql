CREATE TABLE respostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Seção 1: Dados pessoais
  nome_completo TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Seção 2: Sobre o idioma
  nivel_coreano TEXT NOT NULL,
  coreano_no_dia_a_dia TEXT,
  motivacao TEXT,
  maior_dificuldade TEXT,
  tentou_antes TEXT,

  -- Seção 3: Dados demográficos
  faixa_etaria TEXT,
  estado_civil TEXT,
  estado_civil_outro TEXT,
  tem_filhos TEXT,
  quantidade_filhos TEXT,
  tem_netos TEXT,
  quantidade_netos TEXT,
  escolaridade TEXT,
  area_formacao TEXT,
  momento_profissional TEXT,
  faixa_renda TEXT,

  -- Seção 4: Prontidão
  tempo_dedicacao TEXT,
  interesse_curso_completo TEXT,
  o_que_faria_investir TEXT
);
