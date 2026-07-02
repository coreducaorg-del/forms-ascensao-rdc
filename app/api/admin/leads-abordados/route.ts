import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("leads_abordados")
      .select("resposta_id");

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { resposta_id } = await request.json();

    const { error } = await supabaseAdmin
      .from("leads_abordados")
      .insert({ resposta_id });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
