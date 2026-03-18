import { useMemo, useEffect, useState, useCallback, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CONFIDENCE_LEVELS, type ConfidenceLevel } from "../lib/protocol.ts";

interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

interface ResultsProps {
  votes: Record<string, string>;
  players: PlayerInfo[];
  confidences: Record<string, ConfidenceLevel>;
  explanations: Record<string, string>;
  currentUserId: string;
  onExplain: (text: string) => void;
}

interface VoteStats {
  average: number | null;
  min: number | null;
  max: number | null;
  spread: number | null;
  consensusPercent: number;
  mostCommon: string;
}

function computeStats(votes: Record<string, string>): VoteStats {
  const values = Object.values(votes);
  const numericValues = values
    .map((v) => parseFloat(v))
    .filter((n) => !isNaN(n));

  // Count occurrences for consensus
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let maxCount = 0;
  let mostCommon = values[0] ?? "?";
  for (const [val, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = val;
    }
  }
  const consensusPercent =
    values.length > 0 ? Math.round((maxCount / values.length) * 100) : 0;

  if (numericValues.length === 0) {
    return {
      average: null,
      min: null,
      max: null,
      spread: null,
      consensusPercent,
      mostCommon,
    };
  }

  const avg =
    numericValues.reduce((sum, n) => sum + n, 0) / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  return {
    average: Math.round(avg * 10) / 10,
    min,
    max,
    spread: max - min,
    consensusPercent,
    mostCommon,
  };
}

function isOutlier(votes: Record<string, string>, playerId: string): boolean {
  const playerVote = votes[playerId];
  if (playerVote === undefined) return false;

  const playerNumeric = parseFloat(playerVote);
  if (isNaN(playerNumeric)) return false;

  const numericValues = Object.values(votes)
    .map((v) => parseFloat(v))
    .filter((n) => !isNaN(n));

  if (numericValues.length < 3) return false;

  const sorted = [...numericValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);

  if (median <= 0) return false;

  return playerNumeric > 2 * median || playerNumeric < 0.5 * median;
}

function useDetectMemeMessage(votes: Record<string, string>): string | null {
  const { t } = useTranslation();

  return useMemo(() => {
    const values = Object.values(votes);
    if (values.length === 0) return null;

    const numericValues = values
      .map((v) => parseFloat(v))
      .filter((n) => !isNaN(n));

    // Count occurrences
    const counts = new Map<string, number>();
    for (const v of values) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    const uniqueValues = new Set(values);

    // Only 1 voter
    if (values.length === 1) {
      return t("results.meme.lonelyVote");
    }

    // Everyone voted the same (2+ voters)
    if (uniqueValues.size === 1) {
      const single = values[0];
      if (single === "☕" || single?.toLowerCase() === "coffee") {
        return t("results.meme.breakTime");
      }
      if (single === "?") {
        return t("results.meme.nobodyKnows");
      }
      return t("results.meme.shipIt");
    }

    // All votes are low (<=3)
    if (
      numericValues.length === values.length &&
      numericValues.every((n) => n <= 3)
    ) {
      return t("results.meme.tooEasy");
    }

    // All votes are high (>=13)
    if (
      numericValues.length === values.length &&
      numericValues.every((n) => n >= 13)
    ) {
      return t("results.meme.doomed");
    }

    // Huge spread (max - min >= 10)
    if (numericValues.length >= 2) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      if (max - min >= 10) {
        return t("results.meme.noIdea");
      }
    }

    // Exactly one outlier
    if (numericValues.length >= 3) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
          : (sorted[mid] ?? 0);

      if (median > 0) {
        const outliers = numericValues.filter(
          (n) => Math.abs(n - median) > 2 * median
        );
        if (outliers.length === 1) {
          return t("results.meme.seenThings");
        }
      }
    }

    // High consensus (>=80%) but not unanimous
    if (uniqueValues.size > 1) {
      let localMaxCount = 0;
      for (const count of counts.values()) {
        if (count > localMaxCount) localMaxCount = count;
      }
      const consensusPercent = Math.round((localMaxCount / values.length) * 100);
      if (consensusPercent >= 80) {
        return t("results.meme.almostThere");
      }
    }

    return null;
  }, [votes, t]);
}

function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ["#BA3033", "#F8ABAA", "#F0649B", "#7F6CB1", "#94A979"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        top: -8,
      }}
      initial={{ y: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: 400,
        rotate: rotation + 720,
        opacity: 0,
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.8,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white shadow-sm border border-gray-100"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="text-2xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </motion.div>
  );
}

function MemeReveal({ message }: { message: string }) {
  return (
    <motion.p
      className="text-2xl sm:text-3xl font-extrabold text-center leading-snug"
      style={{
        background: "linear-gradient(135deg, #BA3033, #F0649B, #7F6CB1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
    >
      {message}
    </motion.p>
  );
}

const CONFIDENCE_EMOJI: Record<ConfidenceLevel, string> = {
  [CONFIDENCE_LEVELS.confident]: "\uD83D\uDE0E",
  [CONFIDENCE_LEVELS.guessing]: "\uD83E\uDD14",
  [CONFIDENCE_LEVELS.noIdea]: "\uD83E\uDD37",
};

const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  [CONFIDENCE_LEVELS.confident]: "#94A979",
  [CONFIDENCE_LEVELS.guessing]: "#F39C12",
  [CONFIDENCE_LEVELS.noIdea]: "#E74C3C",
};

interface ConfidenceSummary {
  confident: number;
  guessing: number;
  noIdea: number;
  overall: "HIGH" | "MEDIUM" | "LOW";
  overallColor: string;
}

function computeConfidenceSummary(
  confidences: Record<string, ConfidenceLevel>,
): ConfidenceSummary {
  const values = Object.values(confidences);
  let confident = 0;
  let guessing = 0;
  let noIdea = 0;

  for (const v of values) {
    if (v === CONFIDENCE_LEVELS.confident) confident++;
    else if (v === CONFIDENCE_LEVELS.guessing) guessing++;
    else if (v === CONFIDENCE_LEVELS.noIdea) noIdea++;
  }

  const total = values.length;
  let overall: "HIGH" | "MEDIUM" | "LOW";
  let overallColor: string;

  if (noIdea > 0) {
    overall = "LOW";
    overallColor = "#E74C3C";
  } else if (total > 0 && confident > total / 2) {
    overall = "HIGH";
    overallColor = "#94A979";
  } else {
    overall = "MEDIUM";
    overallColor = "#F39C12";
  }

  return { confident, guessing, noIdea, overall, overallColor };
}

function ConfidenceBar({ confidences }: { confidences: Record<string, ConfidenceLevel> }) {
  const { t } = useTranslation();
  const summary = useMemo(
    () => computeConfidenceSummary(confidences),
    [confidences],
  );

  const total = summary.confident + summary.guessing + summary.noIdea;
  if (total === 0) return null;

  const OVERALL_LABELS: Record<string, string> = {
    HIGH: t("results.confidenceHigh"),
    MEDIUM: t("results.confidenceMedium"),
    LOW: t("results.confidenceLow"),
  };

  const badges: Array<{ count: number; label: string; color: string; emoji: string }> = [];
  if (summary.confident > 0) {
    badges.push({ count: summary.confident, label: t("results.confidentCount", { count: summary.confident }), color: "#94A979", emoji: "\uD83D\uDE0E" });
  }
  if (summary.guessing > 0) {
    badges.push({ count: summary.guessing, label: t("results.guessingCount", { count: summary.guessing }), color: "#F39C12", emoji: "\uD83E\uDD14" });
  }
  if (summary.noIdea > 0) {
    badges.push({ count: summary.noIdea, label: t("results.noIdeaCount", { count: summary.noIdea }), color: "#E74C3C", emoji: "\uD83E\uDD37" });
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">{t("results.teamConfidence")}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: summary.overallColor }}
        >
          {OVERALL_LABELS[summary.overall] ?? summary.overall}
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {badges.map((badge) => (
          <span
            key={badge.color}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border"
            style={{ borderColor: badge.color, color: badge.color }}
          >
            <span>{badge.emoji}</span>
            {badge.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function Results({ votes, players, confidences, explanations, currentUserId, onExplain }: ResultsProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => computeStats(votes), [votes]);
  const memeMessage = useDetectMemeMessage(votes);
  const [showConfetti, setShowConfetti] = useState(false);
  const [explainText, setExplainText] = useState("");

  const currentUserIsOutlier = useMemo(
    () => isOutlier(votes, currentUserId),
    [votes, currentUserId],
  );

  const hasAlreadyExplained = currentUserId in explanations;

  const handleExplainSubmit = useCallback(() => {
    const trimmed = explainText.trim();
    if (trimmed) {
      onExplain(trimmed);
      setExplainText("");
    }
  }, [explainText, onExplain]);

  useEffect(() => {
    if (stats.consensusPercent >= 80) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [stats.consensusPercent]);

  const playerMap = useMemo(() => {
    const map = new Map<string, PlayerInfo>();
    for (const p of players) {
      map.set(p.id, p);
    }
    return map;
  }, [players]);

  return (
    <motion.div
      id="results"
      className="relative flex flex-col items-center gap-6 p-6 rounded-2xl bg-white/90 shadow-lg border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <h3 className="text-lg font-bold text-[#BA3033]">{t("results.title")}</h3>

      {/* Meme reveal */}
      <AnimatePresence>
        {memeMessage !== null && <MemeReveal message={memeMessage} />}
      </AnimatePresence>

      {/* Stats row */}
      <div className="flex flex-wrap justify-center gap-3">
        {stats.average !== null && (
          <StatCard
            label={t("results.average")}
            value={String(stats.average)}
            color="#BA3033"
          />
        )}
        <StatCard
          label={t("results.consensus")}
          value={`${stats.consensusPercent}%`}
          color={stats.consensusPercent >= 80 ? "#94A979" : "#7F6CB1"}
        />
        {stats.min !== null && (
          <StatCard
            label={t("results.min")}
            value={String(stats.min)}
            color="#7F6CB1"
          />
        )}
        {stats.max !== null && (
          <StatCard
            label={t("results.max")}
            value={String(stats.max)}
            color="#F0649B"
          />
        )}
        {stats.spread !== null && (
          <StatCard
            label={t("results.spread")}
            value={String(stats.spread)}
            color="#94A979"
          />
        )}
      </div>

      {/* Confidence summary */}
      <ConfidenceBar confidences={confidences} />

      {/* Individual votes */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {Object.entries(votes).map(([playerId, vote]) => {
          const player = playerMap.get(playerId);
          const confidence = confidences[playerId];
          return (
            <motion.div
              key={playerId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{
                  backgroundColor: player?.color ?? "#7F6CB1",
                }}
              >
                {player?.name.charAt(0).toUpperCase() ?? "?"}
              </div>
              <span className="text-sm font-semibold text-[#BA3033]">
                {vote}
              </span>
              {confidence && (
                <span
                  className="text-xs"
                  title={confidence}
                  style={{ color: CONFIDENCE_COLOR[confidence] }}
                >
                  {CONFIDENCE_EMOJI[confidence]}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Outlier explanation prompt */}
      {currentUserIsOutlier && !hasAlreadyExplained && (
        <motion.div
          className="flex flex-col items-center gap-2 w-full max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-gray-600 font-medium">
            {t("results.outlierPrompt")}
          </p>
          <div className="flex w-full gap-2">
            <input
              type="text"
              value={explainText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setExplainText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleExplainSubmit();
              }}
              placeholder={t("results.explainPlaceholder")}
              className="flex-1 px-3 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all text-sm"
              maxLength={200}
            />
            <motion.button
              className="px-4 py-2 rounded-xl bg-[#BA3033] text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: explainText.trim() ? 1.02 : 1 }}
              whileTap={{ scale: explainText.trim() ? 0.98 : 1 }}
              onClick={handleExplainSubmit}
              disabled={!explainText.trim()}
            >
              {t("results.sendButton")}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Explanations */}
      {Object.keys(explanations).length > 0 && (
        <motion.div
          className="flex flex-col gap-2 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-bold text-gray-500">{t("results.explanations")}</h4>
          <div className="flex flex-col gap-1.5">
            {Object.entries(explanations).map(([playerId, text]) => {
              const player = playerMap.get(playerId);
              return (
                <motion.div
                  key={playerId}
                  className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                    style={{ backgroundColor: player?.color ?? "#7F6CB1" }}
                  >
                    {player?.name.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-600">
                      {player?.name ?? t("results.unknownPlayer")}
                    </span>
                    <span className="text-sm text-gray-700">{text}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
