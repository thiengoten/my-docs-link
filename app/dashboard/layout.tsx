import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { BottomNav, Sidebar } from "@/components/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-line bg-paper-raised">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <p className="font-display font-bold text-ink lg:hidden">Project Knowledge Hub</p>
            <div className="ml-auto flex items-center gap-3 text-caption text-slate">
              <span className="hidden font-data sm:inline">{user?.email}</span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-20 pt-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
