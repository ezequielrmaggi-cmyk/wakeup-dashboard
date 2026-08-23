import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "../../../lib/whop-sdk";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    await whopsdk.verifyUserToken(req.headers);
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html lang="es"><body style="background:#0A0618;color:#EDE9F7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;">
        <div><h2>No pudimos verificar tu sesión</h2><p>Abrí este dashboard desde adentro de Whop.</p></div>
      </body></html>`,
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const filePath = path.join(process.cwd(), "public", "checklist-template.html");
  const html = fs.readFileSync(filePath, "utf-8");

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
