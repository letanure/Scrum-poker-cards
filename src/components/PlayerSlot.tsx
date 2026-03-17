import { useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Card } from "./Card";

interface PlayerSlotProps {
  name: string;
  color: string;
  hasVoted: boolean;
  vote: string | null;
  isHost: boolean;
  isCurrentUser: boolean;
  voteVersion: number;
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
}: PlayerSlotProps) {
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
      className="flex flex-col items-center gap-2"
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
    </motion.div>
  );
}
