"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function NewReleasePage() {
  const [step, setStep] = useState(0);

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

  function nextStep() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              onClick={() => setStep(index)}
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
              description="Enter the basic information listeners will see on streaming platforms."
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
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Enter the release title"
                  className={inputClass}
                />
              </Field>

              <Field label="Primary artist">
                <input
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
                    <option key={genre}>{genre}</option>
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
            description="Upload square cover art for your release."
            boxTitle="Drop cover artwork here"
            boxText="JPG or PNG • Recommended 3000 × 3000 pixels"
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
          <PlaceholderStep
            eyebrow="Step 4"
            title="Credits and ownership"
            description="Add songwriters, producers, publishers, and copyright information."
            boxTitle="Credits form coming next"
            boxText="We will connect this section to individual tracks"
          />
        )}

        {step === 4 && (
          <div>
            <SectionHeading
              eyebrow="Step 5"
              title="Choose stores"
              description="Select where you would like this release delivered."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Spotify",
                "Apple Music",
                "Amazon Music",
                "YouTube Music",
                "TikTok",
                "Deezer",
                "Pandora",
                "Tidal",
                "Instagram/Facebook",
              ].map((store) => (
                <label
                  key={store}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black p-4 transition hover:border-[#D4AF37]/50"
                >
                  <input
                    type="checkbox"
                    defaultChecked
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
              {[
                ["Release type", form.releaseType],
                ["Title", form.title || "Not entered"],
                ["Primary artist", form.primaryArtist || "Not entered"],
                ["Featured artists", form.featuredArtists || "None"],
                ["Release date", form.releaseDate || "Not selected"],
                ["Genre", form.genre],
                ["Language", form.language],
                ["Explicit", form.explicit],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black p-5"
                >
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    {label}
                  </p>
                  <p className="mt-2 font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#E7C95D]"
            >
              Submit Release for Review
            </button>
          </div>
        )}
      </section>

      <footer className="flex flex-col-reverse gap-3 py-8 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 0}
          className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white/60 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>

        {step < steps.length - 1 && (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-xl bg-[#D4AF37] px-8 py-3 font-bold text-black transition hover:bg-[#E7C95D]"
          >
            Continue
          </button>
        )}
      </footer>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]";

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
}: {
  eyebrow: string;
  title: string;
  description: string;
  boxTitle: string;
  boxText: string;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <button
        type="button"
        className="mt-8 flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black p-8 text-center transition hover:border-[#D4AF37]/70"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-2xl text-[#D4AF37]">
          +
        </span>
        <span className="mt-5 text-lg font-bold">{boxTitle}</span>
        <span className="mt-2 text-sm text-white/40">{boxText}</span>
      </button>
    </div>
  );
}