import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface TopicBarProps {
  topics: string[];
  currentTopicIndex: number;
  isHost: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleEdit?: () => void;
  isEditing?: boolean;
}

export function TopicBar({
  topics,
  currentTopicIndex,
  isHost,
  onPrev,
  onNext,
  onToggleEdit,
  isEditing = false,
}: TopicBarProps) {
  const { t } = useTranslation();
  const hasTopic = topics.length > 0;
  const isFirst = currentTopicIndex <= 0;
  const isLast = currentTopicIndex >= topics.length - 1;
  const isDone = currentTopicIndex >= topics.length;
  const displayIndex = isDone ? topics.length : currentTopicIndex + 1;
  const currentTopic = isDone ? t("topicBar.allDone") : (topics[currentTopicIndex] ?? "");

  return (
    <motion.div
      id="topic-bar"
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 shadow-sm border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {isHost && hasTopic && (
        <motion.button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0"
          whileHover={!isFirst ? { scale: 1.1 } : undefined}
          whileTap={!isFirst ? { scale: 0.9 } : undefined}
          onClick={onPrev}
          disabled={isFirst || isDone}
          aria-label="Previous topic"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {hasTopic ? (
          <>
            <span className="text-xs font-bold text-[#BA3033] whitespace-nowrap">
              {displayIndex} / {topics.length}
            </span>
            <span className="text-sm text-gray-600 truncate" title={currentTopic}>
              {currentTopic}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">
            {t("topicBar.noTopics")}
          </span>
        )}
      </div>

      {/* Progress dots */}
      {hasTopic && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
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
      )}

      {isHost && hasTopic && (
        <motion.button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0"
          whileHover={!isLast && !isDone ? { scale: 1.1 } : undefined}
          whileTap={!isLast && !isDone ? { scale: 0.9 } : undefined}
          onClick={onNext}
          disabled={isLast || isDone}
          aria-label="Next topic"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      )}

      {/* Edit/add topics toggle — host only */}
      {isHost && onToggleEdit && (
        <motion.button
          className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors shrink-0 ${
            isEditing
              ? "bg-[#BA3033] text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#BA3033]"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleEdit}
          title={hasTopic ? t("topicBar.editTopics") : t("topicBar.addTopics")}
        >
          {hasTopic ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
