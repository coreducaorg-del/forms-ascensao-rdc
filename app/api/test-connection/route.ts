import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await supabase.from("leads").select("*").limit(1);

  // 42P01 (Postgres) e PGRST205 (PostgREST) significam que a conexão com o
  // Supabase funcionou, só não existe a tabela "leads" ainda.
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  if (!error || tableMissing) {
    return NextResponse.json({
      success: true,
      message: error
        ? "Conexão com Supabase OK (tabela 'leads' ainda não existe)."
        : "Conexão com Supabase OK.",
    });
  }

  return NextResponse.json(
    {
      success: false,
      message: "Falha ao conectar com o Supabase.",
      error: error.message,
    },
    { status: 500 }
  );
}
