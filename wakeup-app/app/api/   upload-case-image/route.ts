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

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const dataUrl = body?.image;
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "imagen_invalida" }, { status: 400 });
  }

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  // Límite de seguridad: no permitir subir imágenes de más de 15MB
  if (buffer.length > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "imagen_muy_grande" }, { status: 413 });
  }

  const filename = `${userId}/${Date.now()}.png`;
  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from("case-images")
    .upload(filename, buffer, { contentType: "image/png", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "error_subiendo", detalle: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("case-images").getPublicUrl(filename);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
