import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import EditReleaseForm from "./edit-release-form";

type EditReleasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditReleasePage({
  params,
}: EditReleasePageProps) {
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
        artist_id,
        artists (
          artist_name
        )
      `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !release) {
    notFound();
  }

  const artist = Array.isArray(release.artists)
    ? release.artists[0]
    : release.artists;

  return (
    <EditReleaseForm
      release={{
        id: release.id,
        artistId: release.artist_id,
        title: release.title,
        releaseType: release.release_type || "Single",
        genre: release.genre || "Hip-Hop/Rap",
        language: release.language || "English",
        releaseDate: release.release_date || "",
        explicit: Boolean(release.explicit),
        artistName: artist?.artist_name || "",
      }}
    />
  );
}