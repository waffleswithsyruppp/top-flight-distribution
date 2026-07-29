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

  const { data: artist } = await supabase
    .from("artists")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!artist?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-7xl p-10 text-white">
      <p className="text-[#D4AF37] uppercase tracking-[0.25em]">
        TOP FLIGHT DISTRIBUTION
      </p>

      <h1 className="mt-4 text-5xl font-bold">
        Admin Dashboard
      </h1>

      <p className="mt-3 text-white/60">
        Welcome, Administrator.
      </p>
    </main>
  );
}