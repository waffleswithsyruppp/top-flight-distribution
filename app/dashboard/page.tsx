import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              Top Flight Distribution
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Welcome, {artistName}
            </h1>

            <p className="mt-2 text-sm text-white/50">{user.email}</p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            View website
          </Link>
        </header>

        <section className="grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Releases", "0"],
            ["Total streams", "0"],
            ["Royalties", "$0.00"],
            ["Pending review", "0"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-sm text-white/50">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#D4AF37]">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Release catalog
            </p>

            <h2 className="mt-3 text-2xl font-bold">Start your first release</h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Upload your music, artwork, credits, release information, and
              distribution metadata.
            </p>

            <button
              type="button"
              className="mt-7 rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#E7C95D]"
            >
              Create New Release
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-bold">Account status</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/50">Email</span>
                <span className="max-w-[60%] truncate">{user.email}</span>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/50">Account type</span>
                <span>Artist</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <span className="text-[#D4AF37]">Active</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}