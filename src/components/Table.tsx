import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PlayerSlot } from "./PlayerSlot";

interface Player {
  id: string;
  name: string;
  color: string;
  hasVoted: boolean;
  isHost: boolean;
}

interface TableProps {
  players: Player[];
  currentUserId: string;
  revealedVotes: Record<string, string> | null;
  voteVersions: Record<string, number>;
  isHost?: boolean;
  onReveal?: () => void;
  onNewRound?: () => void;
  onNextTopic?: () => void;
  onKick?: (playerId: string) => void;
  onMakeHost?: (playerId: string) => void;
  hasTopics?: boolean;
  isLastTopic?: boolean;
  phase?: string;
}

export function Table({
  players,
  currentUserId,
  revealedVotes,
  voteVersions,
  isHost = false,
  onReveal,
  onNewRound,
  onNextTopic,
  onKick,
  onMakeHost,
  hasTopics = false,
  isLastTopic = false,
  phase,
}: TableProps) {
  const { t } = useTranslation();
  const votedCount = players.filter((p) => p.hasVoted).length;
  const totalCount = players.length;
  const allVoted = votedCount === totalCount && totalCount > 0;
  const isVoting = phase === "voting";
  const isRevealed = phase === "revealed";

  return (
    <div id="table" className="flex flex-col items-center gap-8 py-8">
      {/* Player grid */}
      <div id="table__players" className="flex flex-wrap justify-center gap-6 max-w-2xl">
        {players.map((player) => (
          <PlayerSlot
            key={player.id}
            name={player.name}
            color={player.color}
            hasVoted={player.hasVoted}
            vote={revealedVotes?.[player.id] ?? null}
            isHost={player.isHost}
            isCurrentUser={player.id === currentUserId}
            voteVersion={voteVersions[player.id] ?? 0}
            onKick={
              onKick && player.id !== currentUserId
                ? () => onKick(player.id)
                : undefined
            }
            onMakeHost={
              onMakeHost && player.id !== currentUserId && !player.isHost
                ? () => onMakeHost(player.id)
                : undefined
            }
          />
        ))}
      </div>

      {/* Center status + action */}
      <div id="table__status" className="flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white/80 shadow-md border border-[#F8ABAA]/40 backdrop-blur-sm">
        {revealedVotes ? (
          <>
            <span className="text-sm font-semibold text-[#BA3033]">
              {t("table.votesRevealed")}
            </span>
            {isHost && isRevealed && hasTopics && onNextTopic && (
              <motion.button
                className="px-4 py-1.5 rounded-xl bg-[#7F6CB1] text-white font-semibold text-xs shadow-md cursor-pointer whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNextTopic}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {isLastTopic ? t("table.finishSummary") : t("table.nextStory")}
              </motion.button>
            )}
            {isHost && isRevealed && !hasTopics && onNewRound && (
              <motion.button
                className="px-4 py-1.5 rounded-xl bg-[#7F6CB1] text-white font-semibold text-xs shadow-md cursor-pointer whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNewRound}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {t("table.newRound")}
              </motion.button>
            )}
          </>
        ) : (
          <>
            {allVoted ? (
              <span className="text-sm font-semibold text-[#94A979]">
                {t("table.allVoted")}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-[#7F6CB1]">{votedCount}</span>
                {" / "}
                <span className="font-semibold">{totalCount}</span>
                {" "}{t("table.votedCount")}
              </span>
            )}
            {isHost && isVoting && onReveal && (
              <motion.button
                className="px-4 py-1.5 rounded-xl bg-[#BA3033] text-white font-semibold text-xs shadow-md cursor-pointer whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReveal}
              >
                {t("table.revealCards")}
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
