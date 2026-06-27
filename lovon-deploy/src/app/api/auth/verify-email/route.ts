import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await req.json();
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.verifyCode !== code) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  if (!dbUser.verifyCodeExp || dbUser.verifyCodeExp < new Date()) {
    return NextResponse.json({ error: "Código expirado" }, { status: 400 });
  }
  await db.user.update({ where: { id: user.id }, data: { emailVerified: true, verifyCode: null, verifyCodeExp: null } });
  return NextResponse.json({ ok: true });
}
