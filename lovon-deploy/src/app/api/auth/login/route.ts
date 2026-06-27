import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { handle, password } = await req.json();
    if (!handle || !password) {
      return NextResponse.json({ error: "Handle e senha são obrigatórios" }, { status: 400 });
    }
    // handle can be email or lovon handle
    let user = await db.user.findUnique({ where: { email: handle.toLowerCase() } });
    if (!user) {
      const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() }, include: { user: true } });
      if (agent) user = agent.user;
    }
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    await createSession(user.id);
    await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno" }, { status: 500 });
  }
}
