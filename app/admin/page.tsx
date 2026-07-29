import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminArtist, error: adminError } = await supabase
    .from("artists")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminArtist?.is_admin) {
    redirect("/dashboard");
  }

  const { data: releases, error: releasesError } = await supabase
    .from("releases")
    .select(`
      id,
      title,
      status,
      release_type,
      genre,
      release_date,
      created_at,
      artists (
        artist_name
      ),
      tracks (
        id
      )
    `)
    .eq("status", "Pending Review")
    .order("created_at", { ascending: true });

  const pendingCount = releases?.length ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 text-white sm:px-10">
      <header className="border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
          Top Flight Distribution
        </p>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-white/50">
              Review and manage artist submissions.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
          >
            Artist Dashboard
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Review" value={pendingCount} />
        <StatCard label="Approved" value="—" />
        <StatCard label="Artists" value="—" />
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Review Queue
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Pending releases
            </h2>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/50">
            {pendingCount} {pendingCount === 1 ? "release" : "releases"}
          </span>
        </div>

        {releasesError ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {releasesError.message}
          </div>
        ) : !releases?.length ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <h3 className="text-lg font-semibold">
              No releases are waiting for review
            </h3>

            <p className="mt-2 text-sm text-white/40">
              New submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {releases.map((release) => {
              const artist = Array.isArray(release.artists)
                ? release.artists[0]
                : release.artists;

              const trackCount = Array.isArray(release.tracks)
                ? release.tracks.length
                : 0;

              return (
                <article
                  key={release.id}
                  className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#D4AF37]/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold">
                        {release.title}
                      </h3>

                      <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                        {release.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-white/60">
                      {artist?.artist_name || "Unknown artist"}
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      {release.release_type || "Release"} ·{" "}
                      {release.genre || "No genre"} ·{" "}
                      {release.release_date || "No release date"} ·{" "}
                      {trackCount} {trackCount === 1 ? "track" : "tracks"}
                    </p>
                  </div>

                  <Link
                    href={`/admin/releases/${release.id}`}
                    className="rounded-xl bg-[#D4AF37] px-5 py-3 text-center text-sm font-bold text-black transition hover:opacity-90"
                  >
                    Review Release
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}