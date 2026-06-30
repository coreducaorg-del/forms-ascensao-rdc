// ATENÇÃO: Este cliente possui acesso administrativo total ao banco de dados.
// NUNCA importe este arquivo em componentes que rodam no navegador (Client Components).
// Use apenas em rotas de API (app/api/.../route.ts) ou Server Components.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
