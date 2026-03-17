import { motion } from "framer-motion";

interface TopicBarProps {
  topics: string[];
  currentTopicIndex: number;
  isHost: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function TopicBar({
  topics,
  currentTopicIndex,
  isHost,
  onPrev,
  onNext,
}: TopicBarProps) {
  if (topics.length === 0) return null;

  const isFirst = currentTopicIndex <= 0;
  const isLast = currentTopicIndex >= topics.length - 1;
  const isDone = currentTopicIndex >= topics.length;
  const displayIndex = isDone ? topics.length : currentTopicIndex + 1;
  const currentTopic = isDone ? "All topics done" : topics[currentTopicIndex];

  return (
    <motion.div
      id="topic-bar"
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 shadow-sm border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {isHost && (
        <motion.button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
          whileHover={!isFirst ? { scale: 1.1 } : undefined}
          whileTap={!isFirst ? { scale: 0.9 } : undefined}
          onClick={onPrev}
          disabled={isFirst || isDone}
          aria-label="Previous topic"
        >
          &#9664;
        </motion.button>
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-xs font-bold text-[#BA3033] whitespace-nowrap">
          {displayIndex} / {topics.length}
        </span>
        <span className="text-sm text-gray-600 truncate" title={currentTopic}>
          {currentTopic}
        </span>
      </div>

      {/* Progress dots */}
      <div className="hidden sm:flex items-center gap-1">
        {topics.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentTopicIndex
                ? "bg-[#BA3033]"
                : i < currentTopicIndex
                  ? "bg-[#94A979]"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {isHost && (
        <motion.button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
          whileHover={!isLast && !isDone ? { scale: 1.1 } : undefined}
          whileTap={!isLast && !isDone ? { scale: 0.9 } : undefined}
          onClick={onNext}
          disabled={isLast || isDone}
          aria-label="Next topic"
        >
          &#9654;
        </motion.button>
      )}
    </motion.div>
  );
}
