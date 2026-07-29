import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { reviewRelease } from "./actions";
type AdminReleasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelatedArtist =
  | {
      artist_name: string | null;
    }
  | {
      artist_name: string | null;
    }[]
  | null;

type Track = {
  id: string;
  title: string | null;
  track_number: number | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  explicit: boolean | null;
  isrc: string | null;
  duration: number | null;
  songwriter: string | null;
  producer: string | null;
  composer: string | null;
};

export default async function AdminReleasePage({
  params,
}: AdminReleasePageProps) {
  const { id } = await params;
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

  const { data: release, error } = await supabase
    .from("releases")
    .select(`
      id,
      title,
      status,
      admin_notes,
      release_type,
      genre,
      language,
      release_date,
      explicit,
      artwork_url,
      created_at,
      artists (
        artist_name
      ),
      tracks (
        id,
        title,
        track_number,
        file_name,
        file_size,
        mime_type,
        explicit,
        isrc,
        duration,
        songwriter,
        producer,
        composer
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-white">
        <Link
          href="/admin"
          className="text-sm text-white/50 transition hover:text-[#D4AF37]"
        >
          ← Back to admin dashboard
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

  const artist = getArtist(release.artists as RelatedArtist);

  const tracks = [...((release.tracks as Track[] | null) ?? [])].sort(
    (a, b) => (a.track_number ?? 0) - (b.track_number ?? 0),
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 text-white sm:px-10">
      <Link
        href="/admin"
        className="text-sm text-white/50 transition hover:text-[#D4AF37]"
      >
        ← Back to review queue
      </Link>

      <header className="mt-8 flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            Release Review
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold sm:text-5xl">
              {release.title}
            </h1>

            <StatusBadge status={release.status} />
          </div>

          <p className="mt-3 text-white/50">
            {artist?.artist_name || "Unknown artist"}
          </p>
        </div>

        <div className="text-sm text-white/40">
          Submitted{" "}
          {release.created_at
            ? new Date(release.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "on an unknown date"}
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex aspect-square items-center justify-center">
              {release.artwork_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.artwork_url}
                  alt={`${release.title} cover artwork`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl text-[#D4AF37]">♪</div>

                  <p className="mt-4 text-sm text-white/40">
                    No artwork uploaded
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Submission status
            </p>

            <p className="mt-3 font-semibold text-[#D4AF37]">
              {release.status || "Unknown"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Release information</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailCard
                label="Primary artist"
                value={artist?.artist_name || "Not provided"}
              />

              <DetailCard
                label="Release type"
                value={release.release_type || "Not provided"}
              />

              <DetailCard
                label="Release date"
                value={release.release_date || "Not provided"}
              />

              <DetailCard
                label="Genre"
                value={release.genre || "Not provided"}
              />

              <DetailCard
                label="Language"
                value={release.language || "Not provided"}
              />

              <DetailCard
                label="Explicit content"
                value={release.explicit ? "Yes" : "No"}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Tracks</h2>

                <p className="mt-2 text-sm text-white/40">
                  Review audio metadata, identifiers, and credits.
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </span>
            </div>

            {!tracks.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
                No tracks were uploaded.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    position={track.track_number ?? index + 1}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <form action={reviewRelease}>
  <input type="hidden" name="releaseId" value={release.id} />

  <textarea
    name="notes"
    rows={6}
    defaultValue={release.admin_notes || ""}
    placeholder="Write notes for the artist..."
    className="mt-6 w-full resize-y rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/60"
  />

  <div className="mt-6 grid gap-3 sm:grid-cols-3">
    <button
      type="submit"
      name="decision"
      value="approve"
      className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
    >
      Approve Release
    </button>

    <button
      type="submit"
      name="decision"
      value="changes"
      className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
    >
      Request Changes
    </button>

    <button
      type="submit"
      name="decision"
      value="reject"
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/15"
    >
      Reject Release
    </button>
  </div>
</form>

            <p className="mt-2 text-sm text-white/40">
              Add feedback before approving or returning the release.
            </p>

            <textarea
              rows={6}
              placeholder="Write notes for the artist..."
              className="mt-6 w-full resize-y rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/60"
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                Approve Release
              </button>

              <button
                type="button"
                className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
              >
                Request Changes
              </button>

              <button
                type="button"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/15"
              >
                Reject Release
              </button>
            </div>

            <p className="mt-4 text-xs text-white/30">
              The review buttons are visual for now. We will connect them to
              Supabase next.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function TrackCard({
  track,
  position,
}: {
  track: Track;
  position: number;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 font-bold text-[#D4AF37]">
          {position}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-semibold">
              {track.title || "Untitled track"}
            </h3>

            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-white/40">
              {track.explicit ? "Explicit" : "Clean"}
            </span>
          </div>

          <p className="mt-2 truncate text-xs text-white/40">
            {track.file_name || "No filename"} ·{" "}
            {formatFileSize(track.file_size)}
          </p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <MiniDetail label="ISRC" value={track.isrc || "Not assigned"} />
            <MiniDetail
              label="Duration"
              value={formatDuration(track.duration)}
            />
            <MiniDetail
              label="File type"
              value={track.mime_type || "Unknown"}
            />
            <MiniDetail
              label="Songwriter"
              value={track.songwriter || "Not provided"}
            />
            <MiniDetail
              label="Producer"
              value={track.producer || "Not provided"}
            />
            <MiniDetail
              label="Composer"
              value={track.composer || "Not provided"}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 font-semibold">{value}</p>
    </div>
  );
}

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p className="mt-1 truncate text-white/65">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
      {status || "Unknown"}
    </span>
  );
}

function getArtist(artists: RelatedArtist) {
  if (Array.isArray(artists)) {
    return artists[0] ?? null;
  }

  return artists;
}

function formatFileSize(size: number | null) {
  if (!size) {
    return "Unknown size";
  }

  const megabytes = size / 1024 / 1024;
  return `${megabytes.toFixed(1)} MB`;
}

function formatDuration(duration: number | null) {
  if (!duration) {
    return "Not provided";
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
