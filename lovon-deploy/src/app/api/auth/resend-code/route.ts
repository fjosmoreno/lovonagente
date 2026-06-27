import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, generateCode } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const verifyCode = generateCode();
  const verifyCodeExp = new Date(Date.now() + 15 * 60 * 1000);
  await db.user.update({ where: { id: user.id }, data: { verifyCode, verifyCodeExp } });
  return NextResponse.json({ ok: true, verifyCode });
}
