import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

// Change password
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, next, confirm } = await req.json();
  if (!current || !next || next.length < 6) return NextResponse.json({ error: "Nova senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  if (next !== confirm) return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 });
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !verifyPassword(current, dbUser.passwordHash)) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  return NextResponse.json({ ok: true });
}
