import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="z-10 mt-6 flex flex-col items-center gap-1.5 text-white/40 text-[11px]">
      <nav className="flex items-center gap-2">
        <Link to="/about" className="hover:text-white/60 transition-colors">
          {t("footer.about")}
        </Link>
        <span>&middot;</span>
        <Link to="/privacy" className="hover:text-white/60 transition-colors">
          {t("footer.privacy")}
        </Link>
        <span>&middot;</span>
        <a
          href="https://github.com/letanure/Scrum-poker-cards"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/60 transition-colors"
        >
          {t("footer.github")}
        </a>
      </nav>
      <p>{t("footer.madeWith")}</p>
      <p>{t("footer.cardLicense")}</p>
    </footer>
  );
}
