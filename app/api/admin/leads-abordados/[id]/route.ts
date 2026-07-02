import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("leads_abordados")
      .delete()
      .eq("resposta_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
