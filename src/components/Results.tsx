import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

interface ResultsProps {
  votes: Record<string, string>;
  players: PlayerInfo[];
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

export function Results({ votes, players }: ResultsProps) {
  const stats = useMemo(() => computeStats(votes), [votes]);
  const [showConfetti, setShowConfetti] = useState(false);

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

      <h3 className="text-lg font-bold text-[#BA3033]">Results</h3>

      {/* Stats row */}
      <div className="flex flex-wrap justify-center gap-3">
        {stats.average !== null && (
          <StatCard
            label="Average"
            value={String(stats.average)}
            color="#BA3033"
          />
        )}
        <StatCard
          label="Consensus"
          value={`${stats.consensusPercent}%`}
          color={stats.consensusPercent >= 80 ? "#94A979" : "#7F6CB1"}
        />
        {stats.min !== null && (
          <StatCard
            label="Min"
            value={String(stats.min)}
            color="#7F6CB1"
          />
        )}
        {stats.max !== null && (
          <StatCard
            label="Max"
            value={String(stats.max)}
            color="#F0649B"
          />
        )}
        {stats.spread !== null && (
          <StatCard
            label="Spread"
            value={String(stats.spread)}
            color="#94A979"
          />
        )}
      </div>

      {/* Individual votes */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {Object.entries(votes).map(([playerId, vote]) => {
          const player = playerMap.get(playerId);
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
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
