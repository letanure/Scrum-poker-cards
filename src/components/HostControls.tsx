import { useState, useCallback, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HostControlsProps {
  topic: string;
  onSetTopic: (topic: string) => void;
  hasTopics?: boolean;
  topics?: string[];
  onSetTopics?: (topics: string[]) => void;
}

export function HostControls({
  topic,
  onSetTopic,
  hasTopics = false,
  topics = [],
  onSetTopics,
}: HostControlsProps) {
  const [localTopic, setLocalTopic] = useState(topic);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [bulkText, setBulkText] = useState("");

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

  const handleAddBulk = useCallback(() => {
    if (!onSetTopics) return;
    const newTopics = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (newTopics.length === 0) return;
    onSetTopics([...topics, ...newTopics]);
    setBulkText("");
  }, [bulkText, topics, onSetTopics]);

  const handleRemoveTopic = useCallback(
    (index: number) => {
      if (!onSetTopics) return;
      onSetTopics(topics.filter((_, i) => i !== index));
    },
    [topics, onSetTopics],
  );

  const handleClearAll = useCallback(() => {
    if (!onSetTopics) return;
    onSetTopics([]);
  }, [onSetTopics]);

  return (
    <motion.div
      id="host-controls"
      className="flex flex-col gap-3 p-4 rounded-2xl bg-white/90 shadow-md border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Topic input — only when no topic queue */}
      {!hasTopics && (
        <div className="w-full">
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
      )}

      {/* Expandable topic queue section */}
      {onSetTopics && (
        <div className="border-t border-gray-100 pt-2">
          <button
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#BA3033] cursor-pointer transition-colors w-full text-left"
            onClick={() => setShowTopicInput((prev) => !prev)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3 transition-transform"
              style={{ transform: showTopicInput ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>Add topics queue (optional)</span>
            {topics.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-[#BA3033] text-white text-xs font-bold">
                {topics.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showTopicInput && (
              <motion.div
                className="flex flex-col gap-3 mt-3"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-2">
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste topics here, one per line..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all resize-y"
                  />
                  <motion.button
                    className="self-start px-4 py-1.5 rounded-lg bg-[#BA3033] text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddBulk}
                    disabled={bulkText.trim().length === 0}
                  >
                    Add
                  </motion.button>
                </div>

                {topics.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        Topics ({topics.length})
                      </span>
                      <button
                        className="text-xs text-[#BA3033] hover:underline cursor-pointer"
                        onClick={handleClearAll}
                      >
                        Clear all
                      </button>
                    </div>
                    <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      {topics.map((t, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-700"
                        >
                          <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">
                            {i + 1}.
                          </span>
                          <span className="flex-1 truncate">{t}</span>
                          <button
                            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#BA3033] hover:bg-red-50 cursor-pointer transition-colors shrink-0"
                            onClick={() => handleRemoveTopic(i)}
                            aria-label={`Remove: ${t}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
