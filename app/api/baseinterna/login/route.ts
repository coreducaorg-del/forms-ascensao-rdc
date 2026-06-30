import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "E-mail é obrigatório" },
        { status: 400 }
      );
    }

    const emailNormalizado = email.toLowerCase().trim();

    const { data: resposta, error: errorResposta } = await supabaseAdmin
      .from("respostas")
      .select("email, nome_completo")
      .ilike("email", emailNormalizado)
      .single();

    if (errorResposta || !resposta) {
      return NextResponse.json(
        {
          success: false,
          error:
            "E-mail não encontrado. Verifique se digitou o e-mail correto que você usou no formulário.",
        },
        { status: 404 }
      );
    }

    const { data: acessoExistente } = await supabaseAdmin
      .from("acessos_aula")
      .select("*")
      .ilike("email", emailNormalizado)
      .single();

    const agora = new Date();

    if (!acessoExistente) {
      const dataExpiracao = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error: errorInsert } = await supabaseAdmin
        .from("acessos_aula")
        .insert({
          email: emailNormalizado,
          primeiro_acesso: agora.toISOString(),
          data_expiracao: dataExpiracao.toISOString(),
          total_acessos: 1,
          ultimo_acesso: agora.toISOString(),
        });

      if (errorInsert) throw errorInsert;

      return NextResponse.json({ success: true, email: emailNormalizado, liberado: true });
    }

    const dataExpiracao = new Date(acessoExistente.data_expiracao);

    if (agora > dataExpiracao) {
      return NextResponse.json(
        {
          success: false,
          error: "Seu acesso ao Aulão expirou. Entre em contato conosco para mais informações.",
        },
        { status: 403 }
      );
    }

    const { error: errorUpdate } = await supabaseAdmin
      .from("acessos_aula")
      .update({
        ultimo_acesso: agora.toISOString(),
        total_acessos: (acessoExistente.total_acessos || 0) + 1,
      })
      .ilike("email", emailNormalizado);

    if (errorUpdate) throw errorUpdate;

    return NextResponse.json({ success: true, email: emailNormalizado, liberado: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
