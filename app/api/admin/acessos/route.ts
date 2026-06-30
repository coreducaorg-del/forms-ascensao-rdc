import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: acessos, error: errorAcessos } = await supabaseAdmin
      .from("acessos_aula")
      .select("*");

    if (errorAcessos) throw errorAcessos;

    const dadosCombinados = await Promise.all(
      (acessos || []).map(async (acesso) => {
        const { data: resposta } = await supabaseAdmin
          .from("respostas")
          .select(
            "nome_completo, whatsapp, interesse_curso_completo, faixa_renda, escolaridade, faixa_etaria"
          )
          .ilike("email", acesso.email)
          .single();

        return {
          ...acesso,
          ...resposta,
        };
      })
    );

    return NextResponse.json({ success: true, data: dadosCombinados });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
