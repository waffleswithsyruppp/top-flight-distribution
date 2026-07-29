import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ReleaseDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReleaseDetailsPage({
  params,
}: ReleaseDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: release, error } = await supabase
    .from("releases")
    .select(
      `
        id,
        title,
        release_type,
        genre,
        language,
        release_date,
        explicit,
        status,
        admin_notes,
reviewed_at,
        artwork_url,
        created_at,
        artists (
          artist_name
        ),
        tracks (
          id,
          title,
          track_number,
          audio_url,
          isrc,
          duration,
          songwriter,
          producer,
          composer,
          explicit
        )
      `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
if (error) {
  return (
    <main className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/releases"
        className="text-sm text-white/50 transition hover:text-[#D4AF37]"
      >
        ← Back to releases
      </Link>

      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
        {error.message}
      </div>
    </main>
  );
}

if (!release) {
  notFound();
}

const tracks = [...(release.tracks ?? [])].sort(
  (a, b) => (a.track_number ?? 0) - (b.track_number ?? 0),
);  


  if (!release) {
    notFound();
  }

  const artist = Array.isArray(release.artists)
    ? release.artists[0]
    : release.artists;


  return (
    <main className="mx-auto max-w-6xl">
      <header className="border-b border-white/10 pb-8">
        <Link
          href="/dashboard/releases"
          className="text-sm text-white/50 transition hover:text-[#D4AF37]"
        >
          ← Back to releases
        </Link>

        <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              Release details
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold sm:text-4xl">
                {release.title}
              </h1>

              <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                {release.status || "Draft"}
              </span>
            </div>

            <p className="mt-3 text-sm text-white/50">
              {artist?.artist_name || "Unknown artist"}
            </p>
          </div>

          <Link
            href={`/dashboard/releases/${release.id}/edit`}
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white/70 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
          >
            Edit Release
          </Link>
        </div>
      </header>

      <section className="grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            {release.artwork_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={release.artwork_url}
                alt={`${release.title} cover artwork`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center">
                <p className="text-5xl text-[#D4AF37]">♪</p>
                <p className="mt-4 text-sm text-white/35">
                  No artwork uploaded
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Submission status
            </p>

            <p className="mt-2 font-semibold text-[#D4AF37]">
              {release.status || "Draft"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold">Release information</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Release type"
                value={release.release_type || "Not entered"}
              />

              <DetailItem
                label="Primary artist"
                value={artist?.artist_name || "Not entered"}
              />

              <DetailItem
                label="Release date"
                value={release.release_date || "Not selected"}
              />

              <DetailItem
                label="Genre"
                value={release.genre || "Not selected"}
              />

              <DetailItem
                label="Language"
                value={release.language || "Not selected"}
              />

              <DetailItem
                label="Explicit content"
                value={release.explicit ? "Yes" : "No"}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Tracks</h2>

                <p className="mt-2 text-sm text-white/45">
                  Audio files, credits, and identifiers for this release.
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </span>
            </div>

            {tracks.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black p-8 text-center">
                <p className="font-semibold">No tracks added yet</p>

                <p className="mt-2 text-sm text-white/40">
                  Audio upload and track metadata will be added next.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {tracks
                  .sort(
                    (first, second) =>
                      (first.track_number || 0) -
                      (second.track_number || 0),
                  )
                  .map((track) => (
                    <article
                      key={track.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black p-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                          {track.track_number || "—"}
                        </span>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {track.title || "Untitled track"}
                          </h3>

                          <p className="mt-1 truncate text-xs text-white/40">
                            ISRC: {track.isrc || "Not assigned"}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-white/40">
                        {track.explicit ? "Explicit" : "Clean"}
                      </span>
                    </article>
                  ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-bold">Submission timeline</h2>

            <div className="mt-6 flex gap-4">
              <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#D4AF37]" />

              <div>
                <p className="font-semibold">Release created</p>

                <p className="mt-1 text-sm text-white/40">
                  {new Date(release.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-3 font-semibold text-white">
        {value || "Not provided"}
      </p>
    </div>
  );
}