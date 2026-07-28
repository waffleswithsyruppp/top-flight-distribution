import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import LogoutButton from "@/components/dashboard/logout-button";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Releases", href: "/dashboard/releases" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Royalties", href: "/dashboard/royalties" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Settings", href: "/dashboard/settings" },
  { label: "Support", href: "/dashboard/support" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const artistName =
    typeof user.user_metadata?.artist_name === "string"
      ? user.user_metadata.artist_name
      : "Artist";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#080808] p-6 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
              TF
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]">
                Top Flight
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
                Distribution
              </p>
            </div>
          </Link>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Artist account
            </p>

            <p className="mt-2 truncate font-semibold">{artistName}</p>
            <p className="mt-1 truncate text-xs text-white/40">{user.email}</p>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-[#D4AF37]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <LogoutButton />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-4 backdrop-blur-xl lg:hidden">
            <Link href="/dashboard">
              <p className="text-sm font-bold uppercase tracking-[0.18em]">
                Top Flight
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]">
                Distribution
              </p>
            </Link>

            <Link
              href="/dashboard/releases"
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black"
            >
              Releases
            </Link>
          </header>

          <div className="p-5 sm:p-8 lg:p-10">{children}</div>
        </div>
      </div>
    </div>
  );
}