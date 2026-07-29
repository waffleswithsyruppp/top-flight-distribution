"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const allowedDecisions = {
  approve: "Approved",
  changes: "Changes Requested",
  reject: "Rejected",
} as const;

export async function reviewRelease(formData: FormData) {
  const releaseId = formData.get("releaseId");
  const decision = formData.get("decision");
  const notes = formData.get("notes");

  if (
    typeof releaseId !== "string" ||
    typeof decision !== "string" ||
    !(decision in allowedDecisions)
  ) {
    throw new Error("Invalid review submission.");
  }

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

  const status =
    allowedDecisions[decision as keyof typeof allowedDecisions];

  const adminNotes =
    typeof notes === "string" && notes.trim()
      ? notes.trim()
      : null;

  if (
    (decision === "changes" || decision === "reject") &&
    !adminNotes
  ) {
    throw new Error(
      "Please add a note explaining what the artist needs to change.",
    );
  }

  const { error } = await supabase
    .from("releases")
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", releaseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/releases/${releaseId}`);
  revalidatePath("/dashboard/releases");

  redirect("/admin");
}