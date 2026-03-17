import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./Card";

interface PlayerSlotProps {
  name: string;
  color: string;
  hasVoted: boolean;
  vote: string | null;
  isHost: boolean;
  isCurrentUser: boolean;
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
}: PlayerSlotProps) {
  const isRevealed = vote !== null;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Card area */}
      <div className="h-[60px] flex items-end justify-center">
        <AnimatePresence>
          {hasVoted && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Card
                value={vote ?? "?"}
                isFlipped={!isRevealed}
                isSelected={false}
                size="sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar */}
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
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
      <span className="text-xs text-gray-600 font-medium truncate max-w-[72px]">
        {name}
      </span>
    </motion.div>
  );
}
