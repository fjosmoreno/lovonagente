import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LoginView } from "@/components/views/login-view";
import { AdminView } from "@/components/views/admin-view";
import { ChatView } from "@/components/views/chat-view";
import { ShopView } from "@/components/views/shop-view";
import { PresentView } from "@/components/views/present-view";
import { ResetView } from "@/components/views/reset-view";
import { seedDemoData } from "@/lib/seed";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const chat = params.chat;
  const shop = params.shop;
  const present = params.present;
  const reset = params.reset;

  // Seed demo data on first load
  await seedDemoData();

  // Reset password flow
  if (reset) {
    return <ResetView token={reset} />;
  }

  // Public chat
  if (chat) {
    return <ChatView handle={chat} />;
  }

  // Public shop
  if (shop) {
    return <ShopView handle={shop} />;
  }

  // Presentation mode
  if (present === "true") {
    return <PresentView />;
  }

  // Check session (HMAC-verified, tamper-proof)
  const session = await getSession();
  if (session) {
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (user) return <AdminView />;
  }

  return <LoginView />;
}
