"use client";

import * as tus from "tus-js-client";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AudioUploaderProps = {
  releaseId: string;
};

type Track = {
  id: string;
  title: string;
  track_number: number | null;
  audio_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  explicit: boolean | null;
};

const acceptedTypes = [
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/flac",
  "audio/x-flac",
];

const maxFileSize = 500 * 1024 * 1024;

export default function AudioUploader({
  releaseId,
}: AudioUploaderProps) {
  const supabase = createClient();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  async function loadTracks() {
    const { data, error } = await supabase
      .from("tracks")
      .select(
        `
          id,
          title,
          track_number,
          audio_path,
          file_name,
          file_size,
          mime_type,
          explicit
        `,
      )
      .eq("release_id", releaseId)
      .order("track_number", { ascending: true });

    if (error) {
      console.error("Track loading error:", error);
      return;
    }

    setTracks(data || []);
  }

  async function addTrack() {
    setMessage("");
    setIsError(false);

    if (!title.trim()) {
      setIsError(true);
      setMessage("Enter the song title.");
      return;
    }

    if (!audioFile) {
      setIsError(true);
      setMessage("Choose a WAV, MP3, or FLAC audio file.");
      return;
    }

    if (!acceptedTypes.includes(audioFile.type)) {
      setIsError(true);
      setMessage("Upload a WAV, MP3, or FLAC audio file.");
      return;
    }

    if (audioFile.size > maxFileSize) {
      setIsError(true);
      setMessage("The audio file must be smaller than 500 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error("Your session expired. Please log in again.");
      }

      const user = session.user;
      const extension =
        audioFile.name.split(".").pop()?.toLowerCase() || "wav";

      const safeFileName = audioFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase();

      const audioPath =
        `${user.id}/${releaseId}/${Date.now()}-${safeFileName}.${extension}`;

      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!projectUrl) {
        throw new Error("Supabase project URL is missing.");
      }

      const projectId = new URL(projectUrl).hostname.split(".")[0];

      await uploadWithTus({
        file: audioFile,
        accessToken: session.access_token,
        projectId,
        bucketName: "release-audio",
        objectName: audioPath,
        onProgress: setUploadProgress,
      });

      const nextTrackNumber = tracks.length + 1;

      const { error: trackError } = await supabase
        .from("tracks")
        .insert({
          release_id: releaseId,
          title: title.trim(),
          track_number: nextTrackNumber,
          audio_path: audioPath,
          file_name: audioFile.name,
          file_size: audioFile.size,
          mime_type: audioFile.type,
          explicit,
        });

      if (trackError) {
        await supabase.storage.from("release-audio").remove([audioPath]);
        throw trackError;
      }

      setTitle("");
      setExplicit(false);
      setAudioFile(null);
      setUploadProgress(0);
      setMessage("Track uploaded successfully.");

      await loadTracks();
    } catch (error) {
      console.error("Audio upload error:", error);

      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The track could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteTrack(track: Track) {
    setMessage("");
    setIsError(false);

    try {
      if (track.audio_path) {
        const { error: storageError } = await supabase.storage
          .from("release-audio")
          .remove([track.audio_path]);

        if (storageError) {
          throw storageError;
        }
      }

      const { error: databaseError } = await supabase
        .from("tracks")
        .delete()
        .eq("id", track.id);

      if (databaseError) {
        throw databaseError;
      }

      setMessage("Track deleted.");
      await loadTracks();
    } catch (error) {
      console.error("Track deletion error:", error);

      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The track could not be deleted.",
      );
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
          Audio
        </p>

        <h2 className="mt-3 text-xl font-bold">Tracks</h2>

        <p className="mt-2 text-sm text-white/50">
          Upload WAV, MP3, or FLAC files and add the song information.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Song title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the song title"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]"
            />
          </Field>

          <Field label="Explicit content">
            <select
              value={explicit ? "Yes" : "No"}
              onChange={(event) =>
                setExplicit(event.target.value === "Yes")
              }
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]"
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-8 text-center transition hover:border-[#D4AF37]/60">
          <span className="text-3xl text-[#D4AF37]">♫</span>

          <span className="mt-3 font-semibold">
            {audioFile ? audioFile.name : "Choose audio file"}
          </span>

          <span className="mt-2 text-xs text-white/40">
            WAV, MP3, or FLAC · Maximum 500 MB
          </span>

          <input
            type="file"
            accept=".wav,.mp3,.flac,audio/wav,audio/x-wav,audio/mpeg,audio/flac,audio/x-flac"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              setAudioFile(event.target.files?.[0] || null);
            }}
          />
        </label>

        {uploading && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/50">
              <span>Uploading audio</span>
              <span>{uploadProgress}%</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-[#D4AF37] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={addTrack}
          disabled={uploading}
          className="mt-5 w-full rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#E7C95D] disabled:opacity-50"
        >
          {uploading ? "Uploading Track..." : "Add Track"}
        </button>

        {message && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black p-8 text-center">
            <p className="font-semibold">No tracks uploaded yet</p>
            <p className="mt-2 text-sm text-white/40">
              Add your first audio file above.
            </p>
          </div>
        ) : (
          tracks.map((track) => (
            <article
              key={track.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 font-bold text-[#D4AF37]">
                  {track.track_number || "—"}
                </span>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {track.title}
                  </h3>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {track.file_name || "Audio file"} ·{" "}
                    {formatFileSize(track.file_size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteTrack(track)}
                className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                Delete
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function uploadWithTus({
  file,
  accessToken,
  projectId,
  bucketName,
  objectName,
  onProgress,
}: {
  file: File;
  accessToken: string;
  projectId: string;
  bucketName: string;
  objectName: string;
  onProgress: (percentage: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint:
        `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],

      headers: {
        authorization: `Bearer ${accessToken}`,
      },

      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,

      metadata: {
        bucketName,
        objectName,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },

      chunkSize: 6 * 1024 * 1024,

      onError(error) {
        reject(error);
      },

      onProgress(bytesUploaded, bytesTotal) {
        const percentage = Math.round(
          (bytesUploaded / bytesTotal) * 100,
        );

        onProgress(percentage);
      },

      onSuccess() {
        resolve();
      },
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      })
      .catch(reject);
  });
}

function formatFileSize(size: number | null) {
  if (!size) {
    return "Unknown size";
  }

  const megabytes = size / 1024 / 1024;

  return `${megabytes.toFixed(1)} MB`;
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