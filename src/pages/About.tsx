import { Link } from "react-router-dom";

export function About() {
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
          About Scrum Poker Cards
        </h1>

        <div className="flex flex-col gap-5 text-gray-600 leading-relaxed">
          <p>A free, fun planning poker tool for agile teams.</p>

          <div className="p-5 rounded-xl bg-gradient-to-br from-[#F8ABAA]/10 to-[#F0649B]/10 border border-[#F8ABAA]/20">
            <p className="font-semibold text-gray-700 mb-2">Thanks to Redbooth</p>
            <p>
              The beautiful card illustrations that inspired this project were created by the team at{" "}
              <a
                href="https://redbooth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                Redbooth
              </a>
              . They designed these playful planning poker cards for their own sprint planning — each card has an idiom that matches the effort level (like "Piece of cake" for a 2, or "Here be dragons" for the unknown).
            </p>
            <p className="mt-2">
              They generously shared them under{" "}
              <a
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                Creative Commons Attribution (CC BY 3.0)
              </a>
              . The{" "}
              <a
                href="https://github.com/redbooth/scrum-poker-cards"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                original repository
              </a>
              {" "}has the card designs in SVG, PNG, and print-ready formats. Thank you, Redbooth!
            </p>
          </div>

          <p>
            This web app was built by{" "}
            <a
              href="https://github.com/letanure"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#BA3033] underline underline-offset-2"
            >
              Luiz Tanure
            </a>
            {" "}— who forked the original card designs years ago, loved the illustrations, and decided to turn them into a real-time multiplayer poker tool. The source code is on{" "}
            <a
              href="https://github.com/letanure/Scrum-poker-cards"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#BA3033] underline underline-offset-2"
            >
              GitHub
            </a>
            .
          </p>

          <p>No accounts, no ads. Just estimate and have fun.</p>

          <div className="pt-4 border-t border-gray-100">
            <p className="font-semibold text-gray-700 mb-2">Contact</p>
            <p>
              Found a bug? Have a feature idea? Open an{" "}
              <a
                href="https://github.com/letanure/Scrum-poker-cards/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                issue on GitHub
              </a>
              {" "}or reach out to{" "}
              <a
                href="https://github.com/letanure"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#BA3033] underline underline-offset-2"
              >
                @letanure
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
