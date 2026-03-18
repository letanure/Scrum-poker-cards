import { useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "./Card";

interface PlayerSlotProps {
  name: string;
  color: string;
  hasVoted: boolean;
  vote: string | null;
  isHost: boolean;
  isCurrentUser: boolean;
  voteVersion: number;
  onKick?: () => void;
  onMakeHost?: () => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function PlayerSlot({
  name,
  color,
  hasVoted,
  vote,
  isHost,
  isCurrentUser,
  voteVersion,
  onKick,
  onMakeHost,
}: PlayerSlotProps) {
  const { t } = useTranslation();
  const isRevealed = vote !== null;
  const controls = useAnimationControls();
  const prevVersionRef = useRef(voteVersion);

  useEffect(() => {
    if (hasVoted && voteVersion > prevVersionRef.current) {
      prevVersionRef.current = voteVersion;
      void controls.start({
        scale: [1, 1.2, 0.9, 1.05, 1],
        rotate: [0, 6, -4, 2, 0],
        transition: { duration: 0.35, ease: "easeOut" },
      });
    }
  }, [voteVersion, hasVoted, controls]);

  return (
    <motion.div
      id="player-slot"
      className="group relative flex flex-col items-center gap-2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Card area */}
      <div id="player-slot__card-area" className="h-[130px] flex items-end justify-center">
        <AnimatePresence>
          {hasVoted && (
            <motion.div
              initial={{ scale: 0, y: 30, rotate: -8 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, bounce: 0.5 }}
            >
              <motion.div animate={controls}>
                <Card
                  value={vote ?? "?"}
                  isFlipped={!isRevealed}
                  isSelected={false}
                  size="md"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar */}
      <div id="player-slot__avatar" className="relative">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ${
            isCurrentUser ? "ring-2 ring-offset-2 ring-[#F0649B]" : ""
          }`}
          style={{ backgroundColor: color }}
        >
          {getInitial(name)}
        </div>

        {/* Host indicator */}
        {isHost && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0649B] rounded-full flex items-center justify-center text-white text-[8px] shadow-sm">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-2.5 h-2.5"
            >
              <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.8L8 12.3 3.7 14.5l.8-4.8L1 6.3l4.8-.8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-sm text-gray-600 font-semibold truncate max-w-[90px]">
        {name}
      </span>

      {/* Host actions — visible on hover */}
      {(onKick || onMakeHost) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMakeHost && (
            <button
              onClick={onMakeHost}
              className="w-6 h-6 rounded-full bg-[#7F6CB1]/10 text-[#7F6CB1] flex items-center justify-center cursor-pointer hover:bg-[#7F6CB1]/20 transition-colors"
              title={t("playerSlot.makeHost")}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.8L8 12.3 3.7 14.5l.8-4.8L1 6.3l4.8-.8z" />
              </svg>
            </button>
          )}
          {onKick && (
            <button
              onClick={onKick}
              className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center cursor-pointer hover:bg-red-100 hover:text-red-500 transition-colors"
              title={t("playerSlot.removePlayer")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
