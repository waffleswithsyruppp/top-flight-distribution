"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

const steps = [
  "Release Details",
  "Artwork",
  "Audio",
  "Credits",
  "Distribution",
  "Review",
];

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

const stores = [
  "Spotify",
  "Apple Music",
  "Amazon Music",
  "YouTube Music",
  "TikTok",
  "Deezer",
  "Pandora",
  "Tidal",
  "Instagram/Facebook",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]";

export default function NewReleasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);

  const [selectedStores, setSelectedStores] = useState<string[]>(stores);
const [artworkFile, setArtworkFile] = useState<File | null>(null);
const [artworkPreview, setArtworkPreview] = useState("");
const [artworkPath, setArtworkPath] = useState("");
const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [form, setForm] = useState({
    releaseType: "Single",
    title: "",
    primaryArtist: "",
    featuredArtists: "",
    releaseDate: "",
    genre: "Hip-Hop/Rap",
    language: "English",
    explicit: "No",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    setSubmitMessage("");
    setSubmitError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    goToStep(Math.min(step + 1, steps.length - 1));
  }

  function previousStep() {
    goToStep(Math.max(step - 1, 0));
  }

  function toggleStore(store: string) {
    setSelectedStores((current) =>
      current.includes(store)
        ? current.filter((item) => item !== store)
        : [...current, store],
    );
  }
async function uploadNewArtwork(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxFileSize = 10 * 1024 * 1024;

  setSubmitMessage("");
  setSubmitError(false);

  if (!allowedTypes.includes(file.type)) {
    setSubmitError(true);
    setSubmitMessage("Upload a JPG, PNG, or WebP image.");
    return;
  }

  if (file.size > maxFileSize) {
    setSubmitError(true);
    setSubmitMessage("Artwork must be smaller than 10 MB.");
    return;
  }
  
  const localPreviewUrl = URL.createObjectURL(file);

setArtworkFile(file);
setArtworkPreview(localPreviewUrl);

setUploadingArtwork(true);
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Your session expired. Please log in again.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `${user.id}/drafts/cover-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("release-artwork")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("release-artwork")
      .getPublicUrl(filePath);

    setArtworkFile(file);
    setArtworkPath(filePath);
  } catch (error) {
    setSubmitError(true);
    setSubmitMessage(
      error instanceof Error ? error.message : "Artwork upload failed.",
    );
  } finally {
    setUploadingArtwork(false);
  }
}
  async function submitRelease() {
    setSubmitMessage("");
    setSubmitError(false);

    if (!form.title.trim()) {
      setSubmitError(true);
      setSubmitMessage("Enter a release title.");
      goToStep(0);
      return;
    }

    if (!form.primaryArtist.trim()) {
      setSubmitError(true);
      setSubmitMessage("Enter the primary artist name.");
      goToStep(0);
      return;
    }

    if (!form.releaseDate) {
      setSubmitError(true);
      setSubmitMessage("Choose a release date.");
      goToStep(0);
      return;
    }

    if (selectedStores.length === 0) {
      setSubmitError(true);
      setSubmitMessage("Select at least one distribution store.");
      goToStep(4);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your session expired. Please log in again.");
      }

      /*
       * Find this user's artist profile.
       * If it does not exist, create it automatically.
       */
      const { data: existingArtist, error: artistLookupError } = await supabase
        .from("artists")
        .select("id, artist_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (artistLookupError) {
        throw artistLookupError;
      }

      let artistId = existingArtist?.id;

      if (!artistId) {
        const { data: newArtist, error: artistInsertError } = await supabase
          .from("artists")
          .insert({
            user_id: user.id,
            artist_name: form.primaryArtist.trim(),
          })
          .select("id")
          .single();

        if (artistInsertError) {
          throw artistInsertError;
        }

      artistId = newArtist.id;
    } else if (
      existingArtist &&
      existingArtist.artist_name !== form.primaryArtist.trim()
    ) {
      const { error: artistUpdateError } = await supabase
        .from("artists")
        .update({
          artist_name: form.primaryArtist.trim(),
        })
        .eq("id", artistId);

      if (artistUpdateError) {
        throw artistUpdateError;
      }
    }      

      const { error: releaseError } = await supabase
        .from("releases")
        .insert({
          user_id: user.id,
          artist_id: artistId,
          title: form.title.trim(),
          release_type: form.releaseType,
          genre: form.genre,
          language: form.language,
          release_date: form.releaseDate,
          explicit: form.explicit === "Yes",
          status: "Pending Review",
        });

      if (releaseError) {
        throw releaseError;
      }

      setSubmitMessage("Release submitted successfully.");

      setTimeout(() => {
        router.push("/dashboard/releases");
        router.refresh();
      }, 800);
    } catch (error) {
      console.error("Release submission error:", error);

      setSubmitError(true);
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : "The release could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <header className="border-b border-white/10 pb-8">
        <Link
          href="/dashboard/releases"
          className="text-sm text-white/50 transition hover:text-[#D4AF37]"
        >
          ← Back to releases
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
            Release manager
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Create New Release
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Add your music, artwork, credits, and store selections before
            submitting the release for review.
          </p>
        </div>
      </header>

      <section className="py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => goToStep(index)}
              className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                index === step
                  ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                  : index < step
                    ? "border-[#D4AF37]/30 bg-white/[0.03] text-white"
                    : "border-white/10 bg-white/[0.02] text-white/35"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-60">
                Step {index + 1}
              </span>

              <span className="mt-1 block">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
        {step === 0 && (
          <div>
            <SectionHeading
              eyebrow="Step 1"
              title="Release details"
              description="Enter the information listeners will see on streaming platforms."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Field label="Release type">
                <select
                  value={form.releaseType}
                  onChange={(event) =>
                    updateField("releaseType", event.target.value)
                  }
                  className={inputClass}
                >
                  <option>Single</option>
                  <option>EP</option>
                  <option>Album</option>
                </select>
              </Field>

              <Field label="Release title">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Enter the release title"
                  className={inputClass}
                />
              </Field>

              <Field label="Primary artist">
                <input
                  type="text"
                  value={form.primaryArtist}
                  onChange={(event) =>
                    updateField("primaryArtist", event.target.value)
                  }
                  placeholder="Artist name"
                  className={inputClass}
                />
              </Field>

              <Field label="Featured artists">
                <input
                  type="text"
                  value={form.featuredArtists}
                  onChange={(event) =>
                    updateField("featuredArtists", event.target.value)
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              <Field label="Release date">
                <input
                  type="date"
                  value={form.releaseDate}
                  onChange={(event) =>
                    updateField("releaseDate", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Primary genre">
                <select
                  value={form.genre}
                  onChange={(event) => updateField("genre", event.target.value)}
                  className={inputClass}
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Language">
                <select
                  value={form.language}
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
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
                  value={form.explicit}
                  onChange={(event) =>
                    updateField("explicit", event.target.value)
                  }
                  className={inputClass}
                >
                  <option>No</option>
                  <option>Yes</option>
                  <option>Clean version</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <PlaceholderStep
            eyebrow="Step 2"
            title="Upload artwork"
            description="Upload square cover artwork for your release."
            boxTitle="Drop cover artwork here"
            boxText="JPG or PNG • Recommended size: 3000 × 3000 pixels"
          />
        )}

        {step === 2 && (
          <PlaceholderStep
            eyebrow="Step 3"
            title="Upload audio"
            description="Add the master audio files for this release."
            boxTitle="Drop WAV audio here"
            boxText="Use lossless WAV files for distribution"
          />
        )}

        {step === 3 && (
          <div>
            <SectionHeading
              eyebrow="Step 4"
              title="Credits and ownership"
              description="Enter the creative and ownership information for this release."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Field label="Songwriter">
                <input
                  type="text"
                  placeholder="Songwriter's legal name"
                  className={inputClass}
                />
              </Field>

              <Field label="Producer">
                <input
                  type="text"
                  placeholder="Producer name"
                  className={inputClass}
                />
              </Field>

              <Field label="Composer">
                <input
                  type="text"
                  placeholder="Composer name"
                  className={inputClass}
                />
              </Field>

              <Field label="Copyright owner">
                <input
                  type="text"
                  placeholder="Copyright owner"
                  className={inputClass}
                />
              </Field>
            </div>

            <p className="mt-6 text-xs leading-5 text-white/35">
              Credits will be connected to the tracks table in the next
              development step.
            </p>
          </div>
        )}

        {step === 4 && (
          <div>
            <SectionHeading
              eyebrow="Step 5"
              title="Choose stores"
              description="Select where you would like this release delivered."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <label
                  key={store}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black p-4 transition hover:border-[#D4AF37]/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store)}
                    onChange={() => toggleStore(store)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />

                  <span className="font-medium">{store}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <SectionHeading
              eyebrow="Step 6"
              title="Review your release"
              description="Confirm the information below before submitting."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ReviewItem label="Release type" value={form.releaseType} />
              <ReviewItem
                label="Title"
                value={form.title || "Not entered"}
              />
              <ReviewItem
                label="Primary artist"
                value={form.primaryArtist || "Not entered"}
              />
              <ReviewItem
                label="Featured artists"
                value={form.featuredArtists || "None"}
              />
              <ReviewItem
                label="Release date"
                value={form.releaseDate || "Not selected"}
              />
              <ReviewItem label="Genre" value={form.genre} />
              <ReviewItem label="Language" value={form.language} />
              <ReviewItem label="Explicit" value={form.explicit} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black p-5">
              <p className="text-xs uppercase tracking-wider text-white/35">
                Selected stores
              </p>

              <p className="mt-2 font-semibold">
                {selectedStores.length > 0
                  ? selectedStores.join(", ")
                  : "No stores selected"}
              </p>
            </div>

            {submitMessage && (
              <div
                className={`mt-8 rounded-xl border px-4 py-3 text-sm ${
                  submitError
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E7C95D]"
                }`}
              >
                {submitMessage}
              </div>
            )}

            <button
              type="button"
              onClick={submitRelease}
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#E7C95D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting release..."
                : "Submit Release for Review"}
            </button>
          </div>
        )}
      </section>

      <footer className="flex flex-col-reverse gap-3 py-8 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 0 || submitting}
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white/60 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>

        {step < steps.length - 1 && (
          <button
            type="button"
            onClick={nextStep}
            disabled={submitting}
            className="rounded-xl bg-[#D4AF37] px-8 py-3 font-bold text-black transition hover:bg-[#E7C95D] disabled:opacity-60"
          >
            Continue
          </button>
        )}
      </footer>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-bold">{title}</h2>

      <p className="mt-2 text-sm text-white/50">{description}</p>
    </div>
  );
}

function PlaceholderStep({
  eyebrow,
  title,
  description,
  boxTitle,
  boxText,
  artworkPreview,
  onFileSelect,
}: {
  eyebrow: string;
  title: string;
  description: string;
  boxTitle: string;
  boxText: string;
  artworkPreview?: string;
  onFileSelect?: (file: File) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
<div className="relative mt-8 flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-[#D4AF37]/60 bg-black p-8 text-center">
  {artworkPreview ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artworkPreview}
        alt="Selected cover artwork"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 rounded-xl bg-black/70 px-4 py-2 text-sm font-semibold text-white">
        Click to replace artwork
      </div>
    </>
  ) : (
    <div className="relative z-10 flex flex-col items-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-2xl text-[#D4AF37]">
        +
      </span>

      <p className="mt-5 text-lg font-semibold text-white">
        {boxTitle}
      </p>

      <p className="mt-2 text-sm text-white/40">
        {boxText}
      </p>
    </div>
  )}

  {onFileSelect && (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];

        if (file) {
          onFileSelect(file);
        }

        event.currentTarget.value = "";
      }}
    />
  )}
</div>
    </section>
  );
}
function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}