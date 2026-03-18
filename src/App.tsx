import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Landing } from "./pages/Landing.tsx";
import { Room } from "./pages/Room.tsx";
import { About } from "./pages/About.tsx";
import { Privacy } from "./pages/Privacy.tsx";
import { SUPPORTED_LANGUAGES } from "./i18n/index.ts";

const LANG_CODES = Object.keys(SUPPORTED_LANGUAGES);

function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang && LANG_CODES.includes(lang) && i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return <>{children}</>;
}

function LanguageRedirect() {
  const { i18n } = useTranslation();
  const lang = LANG_CODES.includes(i18n.language) ? i18n.language : "en";
  return <Navigate to={`/${lang}`} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        {/* Root redirects to detected language */}
        <Route path="/" element={<LanguageRedirect />} />

        {/* Localized static pages */}
        <Route path="/:lang" element={<LanguageWrapper><Landing /></LanguageWrapper>} />
        <Route path="/:lang/about" element={<LanguageWrapper><About /></LanguageWrapper>} />
        <Route path="/:lang/privacy" element={<LanguageWrapper><Privacy /></LanguageWrapper>} />

        {/* Room URLs are universal — no language prefix */}
        <Route path="/room/:roomId" element={<Room />} />

        {/* Legacy routes without lang prefix — redirect */}
        <Route path="/about" element={<LanguageRedirect />} />
        <Route path="/privacy" element={<LanguageRedirect />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
