import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ user, agent });
}
