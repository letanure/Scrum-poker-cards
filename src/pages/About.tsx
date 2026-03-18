import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

export function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1 bg-gradient-to-r from-[#F8ABAA] via-[#F0649B] to-[#BA3033]" />
      <main className="max-w-[640px] mx-auto px-6 py-12">
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-[#BA3033] transition-colors"
        >
          {t("about.backToApp")}
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-8 font-[Nunito]">
          {t("about.title")}
        </h1>

        <div className="flex flex-col gap-5 text-gray-600 leading-relaxed">
          <p>{t("about.intro")}</p>

          <div className="p-5 rounded-xl bg-gradient-to-br from-[#F8ABAA]/10 to-[#F0649B]/10 border border-[#F8ABAA]/20">
            <p className="font-semibold text-gray-700 mb-2">{t("about.thanksTitle")}</p>
            <p>
              <Trans
                i18nKey="about.thanksBody"
                components={{
                  1: (
                    <a
                      href="https://redbooth.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                }}
              />
            </p>
            <p className="mt-2">
              <Trans
                i18nKey="about.thanksLicense"
                components={{
                  1: (
                    <a
                      href="https://creativecommons.org/licenses/by/3.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                  3: (
                    <a
                      href="https://github.com/redbooth/scrum-poker-cards"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                }}
              />
            </p>
          </div>

          <p>
            <Trans
              i18nKey="about.builtBy"
              components={{
                1: (
                  <a
                    href="https://github.com/letanure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#BA3033] underline underline-offset-2"
                  />
                ),
                3: (
                  <a
                    href="https://github.com/letanure/Scrum-poker-cards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#BA3033] underline underline-offset-2"
                  />
                ),
              }}
            />
          </p>

          <p>{t("about.noAds")}</p>

          <div className="pt-4 border-t border-gray-100">
            <p className="font-semibold text-gray-700 mb-2">{t("about.contactTitle")}</p>
            <p>
              <Trans
                i18nKey="about.contactBody"
                components={{
                  1: (
                    <a
                      href="https://github.com/letanure/Scrum-poker-cards/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                  3: (
                    <a
                      href="https://github.com/letanure"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
