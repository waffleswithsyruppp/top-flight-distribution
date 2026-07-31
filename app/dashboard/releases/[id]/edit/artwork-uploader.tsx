"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ArtworkUploaderProps = {
  releaseId: string;
  initialArtworkPath: string | null;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 10 * 1024 * 1024;

export default function ArtworkUploader({
  releaseId,
  initialArtworkPath,
}: ArtworkUploaderProps) {
  const supabase = createClient();

  const [artworkPath, setArtworkPath] = useState(initialArtworkPath);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadPreview() {
      if (!artworkPath) {
        setPreviewUrl("");
        return;
      }

      const { data, error } = await supabase.storage
        .from("release-artwork")
        .createSignedUrl(artworkPath, 3600);

      if (error) {
        console.error("Artwork preview error:", error);
        return;
      }

      setPreviewUrl(data.signedUrl);
    }

    loadPreview();
  }, [artworkPath, supabase]);

  async function uploadArtwork(file: File) {
    setMessage("");
    setIsError(false);

    if (!allowedTypes.includes(file.type)) {
      setIsError(true);
      setMessage("Upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > maxFileSize) {
      setIsError(true);
      setMessage("Artwork must be smaller than 10 MB.");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your session expired. Please log in again.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `${user.id}/${releaseId}/cover-${Date.now()}.${extension}`;

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

      const { error: databaseError } = await supabase
        .from("releases")
        .update({
          artwork_path: filePath,
        })
        .eq("id", releaseId)
        .eq("user_id", user.id);

      if (databaseError) {
        await supabase.storage
          .from("release-artwork")
          .remove([filePath]);

        throw databaseError;
      }

      if (artworkPath && artworkPath !== filePath) {
        const { error: removeError } = await supabase.storage
          .from("release-artwork")
          .remove([artworkPath]);

        if (removeError) {
          console.warn("Old artwork was not removed:", removeError);
        }
      }

      setArtworkPath(filePath);
      setMessage("Artwork uploaded successfully.");
    } catch (error) {
      console.error("Artwork upload error:", error);

      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The artwork could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeArtwork() {
    if (!artworkPath) {
      return;
    }

    setUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your session expired. Please log in again.");
      }

      const { error: storageError } = await supabase.storage
        .from("release-artwork")
        .remove([artworkPath]);

      if (storageError) {
        throw storageError;
      }

      const { error: databaseError } = await supabase
        .from("releases")
        .update({
          artwork_path: null,
        })
        .eq("id", releaseId)
        .eq("user_id", user.id);

      if (databaseError) {
        throw databaseError;
      }

      setArtworkPath(null);
      setPreviewUrl("");
      setMessage("Artwork removed.");
    } catch (error) {
      console.error("Artwork removal error:", error);

      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The artwork could not be removed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
          Cover artwork
        </p>

        <h2 className="mt-3 text-xl font-bold">Upload release artwork</h2>

        <p className="mt-2 text-sm text-white/50">
          Upload a square JPG, PNG, or WebP image. Maximum size: 10 MB.
        </p>
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Release artwork preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <span className="text-4xl text-[#D4AF37]">♪</span>

              <span className="mt-3 text-sm text-white/35">
                No artwork uploaded
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
<div className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-6 transition hover:border-[#D4AF37]/60">
  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xl text-[#D4AF37]">
    +
  </span>

  <span className="mt-4 font-semibold">
    {uploading ? "Uploading..." : "Choose artwork"}
  </span>

  <span className="mt-2 text-xs text-white/40">
    JPG, PNG, or WebP
  </span>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    disabled={uploading}
    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
    onChange={(event) => {
      const file = event.currentTarget.files?.[0];

      if (file) {
        uploadArtwork(file);
      }

      event.currentTarget.value = "";
    }}
  />
</div>
          {artworkPath && (
            <button
              type="button"
              onClick={removeArtwork}
              disabled={uploading}
              className="mt-4 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Remove Artwork
            </button>
          )}

          {message && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}