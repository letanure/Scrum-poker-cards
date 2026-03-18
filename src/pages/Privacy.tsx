import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

export function Privacy() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1 bg-gradient-to-r from-[#F8ABAA] via-[#F0649B] to-[#BA3033]" />
      <main className="max-w-[640px] mx-auto px-6 py-12">
        <Link
          to={`/${i18n.language}`}
          className="text-sm text-gray-400 hover:text-[#BA3033] transition-colors"
        >
          {t("privacy.backToApp")}
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-8 font-[Nunito]">
          {t("privacy.title")}
        </h1>

        <div className="flex flex-col gap-6 text-gray-600 leading-relaxed">
          <p>{t("privacy.intro")}</p>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              {t("privacy.collectTitle")}
            </h2>
            <p>{t("privacy.collectBody")}</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              {t("privacy.dontCollectTitle")}
            </h2>
            <p>{t("privacy.dontCollectBody")}</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">{t("privacy.sessionTitle")}</h2>
            <p>{t("privacy.sessionBody")}</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">{t("privacy.nameTitle")}</h2>
            <p>{t("privacy.nameBody")}</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              {t("privacy.errorTitle")}
            </h2>
            <p>{t("privacy.errorBody")}</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-700 mb-1">
              {t("privacy.cardTitle")}
            </h2>
            <p>
              <Trans
                i18nKey="privacy.cardBody"
                components={{
                  1: (
                    <a
                      href="https://creativecommons.org/licenses/by/3.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BA3033] underline underline-offset-2"
                    />
                  ),
                }}
              />
            </p>
          </section>

          <p className="text-xs text-gray-400 mt-4">
            {t("privacy.lastUpdated")}
          </p>
        </div>
      </main>
    </div>
  );
}
