import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ReleasesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: releases, error } = user
    ? await supabase
        .from("releases")
        .select(
          "id, title, release_type, genre, release_date, status, created_at",
        )
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <main className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
            Release manager
          </p>

          <h1 className="mt-3 text-3xl font-bold">Releases</h1>

          <p className="mt-2 text-sm text-white/50">
            Manage your drafts, submissions, approvals, and scheduled releases.
          </p>
        </div>

        <Link
          href="/dashboard/releases/new"
          className="rounded-xl bg-[#D4AF37] px-5 py-3 text-center text-sm font-bold text-black transition hover:bg-[#E7C95D]"
        >
          Create New Release
        </Link>
      </header>

      {error && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error.message}
        </div>
      )}

      {!error && (!releases || releases.length === 0) && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <h2 className="text-2xl font-bold">No releases yet</h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/50">
            Create your first release and submit it for review.
          </p>

          <Link
            href="/dashboard/releases/new"
            className="mt-7 inline-block rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black"
          >
            Create First Release
          </Link>
        </section>
      )}

      {releases && releases.length > 0 && (
        <section className="mt-10 space-y-4">
          {releases.map((release) => (
            <article
              key={release.id}
              className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold">{release.title}</h2>

                  <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {release.status || "Draft"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-white/50">
                  {release.release_type || "Release"} ·{" "}
                  {release.genre || "No genre"} ·{" "}
                  {release.release_date || "No release date"}
                </p>
              </div>

<Link
  href={`/dashboard/releases/${release.id}`}
  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition inline-flex items-center justify-center"
>
  View Release
</Link>            </article>
          ))}
        </section>
      )}
    </main>
  );
}