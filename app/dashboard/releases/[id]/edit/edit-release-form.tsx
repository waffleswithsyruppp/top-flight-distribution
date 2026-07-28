"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import ArtworkUploader from "./artwork-uploader";
import AudioUploader from "./audio-uploader";

const genres = [
  "Hip-Hop/Rap",
  "R&B/Soul",
  "Pop",
  "Rock",
  "Country",
  "Electronic",
  "Latin",
  "Alternative",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]";

type ReleaseFormData = {
    artworkPath: string | null;
  id: string;
  artistId: string | null;
  title: string;
  releaseType: string;
  genre: string;
  language: string;
  releaseDate: string;
  explicit: boolean;
  artistName: string;
};

export default function EditReleaseForm({
  release,
}: {
  release: ReleaseFormData;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(release.title);
  const [releaseType, setReleaseType] = useState(release.releaseType);
  const [artistName, setArtistName] = useState(release.artistName);
  const [releaseDate, setReleaseDate] = useState(release.releaseDate);
  const [genre, setGenre] = useState(release.genre);
  const [language, setLanguage] = useState(release.language);
  const [explicit, setExplicit] = useState(release.explicit);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveRelease() {
    setMessage("");
    setIsError(false);

    if (!title.trim()) {
      setIsError(true);
      setMessage("Enter a release title.");
      return;
    }

    if (!artistName.trim()) {
      setIsError(true);
      setMessage("Enter an artist name.");
      return;
    }

    if (!releaseDate) {
      setIsError(true);
      setMessage("Choose a release date.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your session expired. Please log in again.");
      }

      const { error: releaseError } = await supabase
        .from("releases")
        .update({
          title: title.trim(),
          release_type: releaseType,
          genre,
          language,
          release_date: releaseDate,
          explicit,
        })
        .eq("id", release.id)
        .eq("user_id", user.id);

      if (releaseError) {
        throw releaseError;
      }

      if (release.artistId) {
        const { error: artistError } = await supabase
          .from("artists")
          .update({
            artist_name: artistName.trim(),
          })
          .eq("id", release.artistId)
          .eq("user_id", user.id);

        if (artistError) {
          throw artistError;
        }
      }

      setMessage("Release updated successfully.");

      setTimeout(() => {
        router.push(`/dashboard/releases/${release.id}`);
        router.refresh();
      }, 600);
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The release could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl">
      <header className="border-b border-white/10 pb-8">
        <Link
          href={`/dashboard/releases/${release.id}`}
          className="text-sm text-white/50 transition hover:text-[#D4AF37]"
        >
          ← Back to release
        </Link>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
          Release manager
        </p>

        <h1 className="mt-3 text-3xl font-bold">Edit Release</h1>

        <p className="mt-2 text-sm text-white/50">
          Update the release information below.
        </p>
      </header>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Release title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Release type">
            <select
              value={releaseType}
              onChange={(event) => setReleaseType(event.target.value)}
              className={inputClass}
            >
              <option>Single</option>
              <option>EP</option>
              <option>Album</option>
            </select>
          </Field>

          <Field label="Primary artist">
            <input
              value={artistName}
              onChange={(event) => setArtistName(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Release date">
            <input
              type="date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Genre">
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className={inputClass}
            >
              {genres.map((genreName) => (
                <option key={genreName}>{genreName}</option>
              ))}
            </select>
          </Field>

          <Field label="Language">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={inputClass}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Portuguese</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Explicit content">
            <select
              value={explicit ? "Yes" : "No"}
              onChange={(event) => setExplicit(event.target.value === "Yes")}
              className={inputClass}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>

          <Field label="Current status">
            <input
              value={release.id ? "Pending Review" : "Draft"}
              disabled
              className={`${inputClass} cursor-not-allowed opacity-50`}
            />
          </Field>
        </div>

        {message && (
          <div
            className={`mt-8 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/dashboard/releases/${release.id}`}
            className="rounded-xl border border-white/10 px-6 py-3 text-center font-semibold text-white/60"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={saveRelease}
            disabled={saving}
            className="rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#E7C95D] disabled:opacity-60"
          >
            {saving ? "Saving changes..." : "Save Changes"}
          </button>
        </div>
</section>

<ArtworkUploader
  releaseId={release.id}
  initialArtworkPath={release.artworkPath}
/>

<AudioUploader
  releaseId={release.id}
/>

    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}