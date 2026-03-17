import { useState, useCallback, type ChangeEvent } from "react";
import { motion } from "framer-motion";

const VOTING_PHASE = "voting" as const;
const REVEALED_PHASE = "revealed" as const;

type Phase = typeof VOTING_PHASE | typeof REVEALED_PHASE;

interface HostControlsProps {
  phase: Phase;
  onReveal: () => void;
  onNewRound: () => void;
  topic: string;
  onSetTopic: (topic: string) => void;
}

export function HostControls({
  phase,
  onReveal,
  onNewRound,
  topic,
  onSetTopic,
}: HostControlsProps) {
  const [localTopic, setLocalTopic] = useState(topic);

  const handleTopicChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setLocalTopic(e.target.value);
    },
    []
  );

  const handleTopicBlur = useCallback(() => {
    if (localTopic !== topic) {
      onSetTopic(localTopic);
    }
  }, [localTopic, topic, onSetTopic]);

  const handleTopicKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && localTopic !== topic) {
        onSetTopic(localTopic);
      }
    },
    [localTopic, topic, onSetTopic]
  );

  return (
    <motion.div
      className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-white/90 shadow-md border border-[#F8ABAA]/30 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Topic input */}
      <div className="flex-1 w-full sm:w-auto">
        <input
          type="text"
          value={localTopic}
          onChange={handleTopicChange}
          onBlur={handleTopicBlur}
          onKeyDown={handleTopicKeyDown}
          placeholder="Enter story or topic..."
          className="w-full px-4 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all"
        />
      </div>

      {/* Action buttons */}
      {phase === VOTING_PHASE && (
        <motion.button
          className="px-6 py-2 rounded-xl bg-[#BA3033] text-white font-semibold text-sm shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReveal}
        >
          Reveal Cards
        </motion.button>
      )}

      {phase === REVEALED_PHASE && (
        <motion.button
          className="px-6 py-2 rounded-xl bg-[#7F6CB1] text-white font-semibold text-sm shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewRound}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          New Round
        </motion.button>
      )}
    </motion.div>
  );
}
