import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n/index.ts";

const LANG_CODES = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = (LANG_CODES.includes(i18n.language as SupportedLanguage)
    ? i18n.language
    : "en") as SupportedLanguage;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
    setOpen(false);

    // Update URL if on a localized page (/:lang or /:lang/about etc.)
    const pathParts = location.pathname.split("/");
    if (pathParts.length >= 2 && LANG_CODES.includes(pathParts[1] as SupportedLanguage)) {
      const rest = pathParts.slice(2).join("/");
      navigate(`/${lang}${rest ? `/${rest}` : ""}`, { replace: true });
    }
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold cursor-pointer hover:bg-white/30 transition-colors select-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Change language"
      >
        <span className="uppercase">{currentLang}</span>
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5 opacity-60">
          <path d="M6 8L1 3h10z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] max-h-[300px] overflow-y-auto"
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {LANG_CODES.map((code) => (
              <button
                key={code}
                className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  code === currentLang
                    ? "bg-[#F8ABAA]/20 text-[#BA3033] font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => handleSelect(code)}
              >
                <span className="uppercase text-xs font-bold text-gray-400 w-6 inline-block">{code}</span>
                {" "}
                {SUPPORTED_LANGUAGES[code]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
