import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "../../../lib/whop-sdk";
import { getSupabase } from "../../../lib/supabase";

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

  const { data, error } = await getSupabase()
    .from("progreso_usuario")
    .select("datos")
    .eq("whop_user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "error_base_datos" }, { status: 500 });
  }

  const estado = data?.datos?.estado || null;
  return NextResponse.json({ estado });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const nuevoEstado = await req.json().catch(() => null);
  if (!nuevoEstado || typeof nuevoEstado !== "object") {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const { data: existing } = await getSupabase()
    .from("progreso_usuario")
