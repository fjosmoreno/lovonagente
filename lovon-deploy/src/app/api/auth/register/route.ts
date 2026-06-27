import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, generateToken, generateCode } from "@/lib/auth";
import { isValidEmail, isValidLovonUrl, extractHandle, generateUniqueHandle } from "@/lib/lovon-utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirm, lovonUrl } = await req.json();
    // validations
    if (!name || name.trim().length < 2) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    if (password !== confirm) return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 });
    if (!isValidLovonUrl(lovonUrl)) return NextResponse.json({ error: "URL Lovon inválida. Use lovon.com.br, lovon.bio ou lovon.com" }, { status: 400 });

    const exists = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });

    const passwordHash = hashPassword(password);
    const verifyCode = generateCode();
    const verifyCodeExp = new Date(Date.now() + 15 * 60 * 1000);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        emailVerified: false,
        verifyCode,
        verifyCodeExp,
      },
    });

    const baseHandle = extractHandle(lovonUrl);
    const handle = await generateUniqueHandle(baseHandle);
    await db.agent.create({
      data: {
        userId: user.id,
        lovonUrl: lovonUrl,
        handle,
        personaName: name.trim().split(" ")[0],
      },
    });

    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      verifyCode,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno" }, { status: 500 });
  }
}
