import { Link } from "react-router-dom";

export function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-1 bg-gradient-to-r from-[#F8ABAA] via-[#F0649B] to-[#BA3033]" />
      <main className="max-w-[640px] mx-auto px-6 py-12">
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-[#BA3033] transition-colors"
        >
          &larr; Back to app
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-8 font-[Nunito]">
          Privacy
        </h1>

        <div className="flex flex-col gap-6 text-gray-600 leading-relaxed">
          <p>
            We respect your privacy. Here&rsquo;s what we do and don&rsquo;t
            do:
          </p>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              What we collect
            </h2>
            <p>
              Anonymous usage analytics via PostHog to understand how the app is
              used. No personal data is collected.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              What we don&rsquo;t collect
            </h2>
            <p>
              No accounts, no emails, no cookies for tracking, no personal
              information.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">Session data</h2>
            <p>
              All poker sessions are ephemeral. They exist only in memory while
              players are connected. Nothing is stored on disk or in a database.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">Your name</h2>
            <p>
              The name you enter is stored only in your browser&rsquo;s
              localStorage for convenience. It never leaves your device except
              during an active session.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              Error tracking
            </h2>
            <p>
              We use Sentry to catch bugs. Error reports may contain technical
              information but no personal data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              Card illustrations
            </h2>
            <p>
              Licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                CC BY 3.0
              </a>{" "}
              by Redbooth.
            </p>
          </section>

          <p className="text-xs text-gray-400 mt-4">
            Last updated: March 2026
          </p>
        </div>
      </main>
    </div>
  );
}
