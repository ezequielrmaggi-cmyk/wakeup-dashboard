import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  // Validación básica: solo permitir http/https, nada de rutas internas
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("protocolo no permitido");
    }
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const imgRes = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (WakeupDashboard ImageProxy)" },
    });

    if (!imgRes.ok) {
      return NextResponse.json({ error: "No se pudo obtener la imagen" }, { status: 502 });
    }

    const contentType = imgRes.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "El link no apunta a una imagen" }, { status: 415 });
    }

    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Error al buscar la imagen" }, { status: 500 });
  }
}
