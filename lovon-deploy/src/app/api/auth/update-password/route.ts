import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST to update password" });
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirm } = await req.json();
    if (!token) return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    if (password !== confirm) return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 });
    const user = await db.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }
    const passwordHash = hashPassword(password);
    await db.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExp: null } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
