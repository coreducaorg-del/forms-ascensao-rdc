CREATE TABLE acessos_aula (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  primeiro_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  total_acessos INTEGER DEFAULT 1,
  ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
