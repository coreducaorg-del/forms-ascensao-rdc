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

    const { data: acesso, error } = await supabaseAdmin
      .from("acessos_aula")
      .select("*")
      .ilike("email", emailNormalizado)
      .single();

    if (error || !acesso) {
      return NextResponse.json(
        { success: false, error: "Acesso não encontrado" },
        { status: 404 }
      );
    }

    const agora = new Date();
    const dataExpiracao = new Date(acesso.data_expiracao);
    const valido = agora <= dataExpiracao;

    const diasRestantes = Math.ceil(
      (dataExpiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      success: true,
      valido,
      diasRestantes: valido ? diasRestantes : 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
