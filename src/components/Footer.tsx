import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="z-10 mt-6 flex flex-col items-center gap-1.5 text-white/40 text-[11px]">
      <nav className="flex items-center gap-2">
        <Link to="/about" className="hover:text-white/60 transition-colors">
          About
        </Link>
        <span>&middot;</span>
        <Link to="/privacy" className="hover:text-white/60 transition-colors">
          Privacy
        </Link>
        <span>&middot;</span>
        <a
          href="https://github.com/letanure/Scrum-poker-cards"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/60 transition-colors"
        >
          GitHub
        </a>
      </nav>
      <p>Made with ♥ by Luiz Tanure</p>
      <p>Card illustrations CC BY 3.0 Redbooth</p>
    </footer>
  );
}
