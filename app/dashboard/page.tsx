import Link from "next/link";

export default function DashboardPage() {
  return (
    <main>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              Artist dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Overview
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Manage your catalog, performance, and royalties.
            </p>
          </div>

          <Link
            href="/dashboard/releases/new"
            className="rounded-xl bg-[#D4AF37] px-5 py-3 text-center text-sm font-bold text-black transition hover:bg-[#E7C95D]"
          >
            Create New Release
          </Link>
        </header>

        <section className="grid gap-5 py-10 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Releases", "0"],
            ["Total streams", "0"],
            ["Royalties", "$0.00"],
            ["Pending review", "0"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-sm text-white/50">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#D4AF37]">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Release catalog
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Start your first release
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Upload music, artwork, credits, release information, and
              distribution metadata.
            </p>

            <Link
              href="/dashboard/releases/new"
              className="mt-7 inline-block rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#E7C95D]"
            >
              Create New Release
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-bold">Getting started</h2>

            <div className="mt-6 space-y-4 text-sm">
              {[
                ["Complete artist profile", "Not started"],
                ["Add payment details", "Not started"],
                ["Upload first release", "Not started"],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0"
                >
                  <span className="text-white/60">{label}</span>
                  <span className="text-xs text-[#D4AF37]">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}