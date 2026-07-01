import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, tempo } = await request.json();

    if (!email || tempo === undefined) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const emailNormalizado = email.toLowerCase().trim();
    const tempoInteiro = Math.floor(Number(tempo));

    const { data: acesso } = await supabaseAdmin
      .from("acessos_aula")
      .select("tempo_maximo_assistido")
      .eq("email", emailNormalizado)
      .single();

    if (acesso && tempoInteiro > (acesso.tempo_maximo_assistido || 0)) {
      const { error } = await supabaseAdmin
        .from("acessos_aula")
        .update({
          tempo_maximo_assistido: tempoInteiro,
          ultimo_acesso: new Date().toISOString(),
        })
        .eq("email", emailNormalizado);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
