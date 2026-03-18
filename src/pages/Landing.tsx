import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { generateRoomId, PRESETS, CARD_MAP, type PresetName } from "../lib/cards.ts";
import { CardBackground } from "../components/CardBackground.tsx";
import { Footer } from "../components/Footer.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";
import { trackEvent } from "../lib/analytics.ts";

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("poker-name") ?? "");
  const [joinLink, setJoinLink] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetName>("all");

  const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

  const presetPreview = PRESETS[selectedPreset].map((value) => {
    const card = CARD_MAP[value];
    return card ? card.label : value;
  }).join("  ");

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    localStorage.setItem("poker-name", name.trim());
    const roomId = generateRoomId();
    trackEvent("session_created", { preset: selectedPreset });
    navigate(`/room/${roomId}`, { state: { playerName: name.trim(), preset: selectedPreset } });
  }, [name, navigate, selectedPreset]);

  const extractRoomId = (input: string): string | null => {
    // Handle full URL like https://host/room/some-room-id
    const urlMatch = /\/room\/([^/?#]+)/.exec(input);
    if (urlMatch) return urlMatch[1];
    // Handle plain room id
    if (input.trim() && !input.includes("/")) return input.trim();
    return null;
  };

  const handleJoin = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !joinLink.trim()) return;
      const roomId = extractRoomId(joinLink);
      if (!roomId) return;
      localStorage.setItem("poker-name", name.trim());
      navigate(`/room/${roomId}`, { state: { playerName: name.trim() } });
    },
    [name, joinLink, navigate],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8ABAA] via-[#F0649B] to-[#BA3033] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated card background */}
      <CardBackground />

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center gap-8 max-w-md w-full z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg font-[Nunito]">
            {t("landing.title")}
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            {t("landing.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col gap-5">
          {/* Name input */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-sm font-semibold text-gray-600 mb-1.5"
            >
              {t("landing.yourName")}
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={t("landing.namePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all text-sm"
              maxLength={30}
            />
          </div>

          {/* Preset selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t("landing.cardDeck")}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_NAMES.map((presetName) => (
                <motion.button
                  key={presetName}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    selectedPreset === presetName
                      ? "bg-[#BA3033] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPreset(presetName)}
                >
                  {t(`presets.${presetName}`)}
                </motion.button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400 tracking-wide truncate">
              {presetPreview}
            </p>
          </div>

          {/* Create button */}
          <motion.button
            className="w-full px-6 py-3 rounded-xl bg-[#BA3033] text-white font-bold text-base shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: name.trim() ? 1.02 : 1 }}
            whileTap={{ scale: name.trim() ? 0.98 : 1 }}
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            {t("landing.createSession")}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">{t("landing.or")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Join section */}
          {showJoin ? (
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                placeholder={t("landing.joinPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#7F6CB1] focus:ring-2 focus:ring-[#7F6CB1]/20 transition-all text-sm"
              />
              <motion.button
                type="submit"
                className="w-full px-6 py-3 rounded-xl bg-[#7F6CB1] text-white font-bold text-base shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{
                  scale: name.trim() && joinLink.trim() ? 1.02 : 1,
                }}
                whileTap={{
                  scale: name.trim() && joinLink.trim() ? 0.98 : 1,
                }}
                disabled={!name.trim() || !joinLink.trim()}
              >
                {t("landing.joinSession")}
              </motion.button>
            </form>
          ) : (
            <motion.button
              className="w-full px-6 py-3 rounded-xl border-2 border-[#7F6CB1] text-[#7F6CB1] font-bold text-base cursor-pointer hover:bg-[#7F6CB1]/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoin(true)}
            >
              {t("landing.joinExisting")}
            </motion.button>
          )}
        </div>

        {/* Fun badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {(["landing.badgeNoSignup", "landing.badgeFree", "landing.badgeFun"] as const).map((key) => (
            <span
              key={key}
              className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm"
            >
              {t(key)}
            </span>
          ))}
        </div>

        {/* SEO description */}
        <h2 className="text-white/50 text-xs text-center max-w-sm leading-relaxed font-normal">
          {t("landing.seoDescription")}
        </h2>
      </motion.div>

      <div className="z-10 mt-4 mb-2">
        <LanguageSwitcher />
      </div>

      <Footer />
    </div>
  );
}
