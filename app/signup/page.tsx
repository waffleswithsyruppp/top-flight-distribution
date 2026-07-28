"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();

  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setIsError(true);
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          artist_name: artistName,
          account_type: "artist",
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setArtistName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage(
      "Account created. Check your email and click the confirmation link."
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-white/60 transition hover:text-[#D4AF37]"
        >
          ← Back to home
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl sm:p-9">
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              Top Flight Distribution
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Create your artist account
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Upload releases, manage metadata, track royalties, and build your
              catalog from one dashboard.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label
                htmlFor="artistName"
                className="mb-2 block text-sm font-medium"
              >
                Artist name
              </label>

              <input
                id="artistName"
                type="text"
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                required
                autoComplete="organization"
                placeholder="Your artist name"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="artist@example.com"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter your password again"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]"
              />
            </div>

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isError
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E7C95D]"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#D4AF37] px-5 py-3.5 font-bold text-black transition hover:bg-[#E7C95D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#D4AF37] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}