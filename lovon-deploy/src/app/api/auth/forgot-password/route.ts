import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken, generateCode } from "@/lib/auth";
import { isValidEmail } from "@/lib/lovon-utils";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!isValidEmail(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "Email não encontrado" }, { status: 404 });
    const resetToken = generateToken();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);
    const code = generateCode();
    await db.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExp } });
    return NextResponse.json({
      ok: true,
      resetToken,
      preview: { to: user.email, code, note: "Preview Ethereal - em produção seria enviado por email" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
