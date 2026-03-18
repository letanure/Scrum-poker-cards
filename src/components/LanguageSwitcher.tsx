import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language === "en";

  const toggle = () => {
    void i18n.changeLanguage(isEn ? "pt" : "en");
  };

  return (
    <motion.button
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold cursor-pointer hover:bg-white/30 transition-colors select-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      aria-label="Toggle language"
    >
      {isEn ? (
        <>
          <span>🇺🇸</span>
          <span>{t("language.en")}</span>
        </>
      ) : (
        <>
          <span>🇧🇷</span>
          <span>{t("language.pt")}</span>
        </>
      )}
    </motion.button>
  );
}
