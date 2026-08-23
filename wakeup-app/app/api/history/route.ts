import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const { userId } = await whopsdk.verifyUserToken(req.headers);
    return userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("progreso_usuario")
    .select("datos")
    .eq("whop_user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "error_base_datos" }, { status: 500 });
  }

  const items = (data?.datos?.historial as unknown[]) || [];
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const nuevaEntrada = await req.json().catch(() => null);
  if (!nuevaEntrada || typeof nuevaEntrada !== "object") {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("progreso_usuario")
    .select("datos")
    .eq("whop_user_id", userId)
    .maybeSingle();

  const historialActual = (existing?.datos?.historial as unknown[]) || [];
  const nuevoHistorial = [nuevaEntrada, ...historialActual].slice(0, 200);

  const { error: upsertError } = await supabase
    .from("progreso_usuario")
    .upsert(
      {
        whop_user_id: userId,
        datos: { historial: nuevoHistorial },
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "whop_user_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: "error_guardando" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, historial: nuevoHistorial });
}
