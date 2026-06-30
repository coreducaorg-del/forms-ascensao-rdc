import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("respostas")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({
    success: true,
    message: "Service role conectado com sucesso",
    totalRegistros: count ?? 0,
  });
}
