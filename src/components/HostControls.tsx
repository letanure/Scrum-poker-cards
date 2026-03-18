import { useState, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [localTopic, setLocalTopic] = useState(topic);
  const [inputText, setInputText] = useState("");

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
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && localTopic !== topic) {
        onSetTopic(localTopic);
      }
    },
    [localTopic, topic, onSetTopic]
  );

  const handleAddTopics = useCallback(() => {
    if (!onSetTopics) return;
    const newTopics = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (newTopics.length === 0) return;
    onSetTopics([...topics, ...newTopics]);
    setInputText("");
  }, [inputText, topics, onSetTopics]);

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddTopics();
      }
    },
    [handleAddTopics]
  );

  const handleRemoveTopic = useCallback(
    (index: number) => {
      if (!onSetTopics) return;
      onSetTopics(topics.filter((_, i) => i !== index));
    },
    [topics, onSetTopics],
  );

  return (
    <div id="host-controls" className="flex flex-col gap-2 w-full">
      {/* Manual topic input — only when no topic queue */}
      {!hasTopics && (
        <input
          type="text"
          value={localTopic}
          onChange={handleTopicChange}
          onBlur={handleTopicBlur}
          onKeyDown={handleTopicKeyDown}
          placeholder={t("host.topicPlaceholder")}
          className="w-full px-4 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all"
        />
      )}

      {/* Topic list with animated items */}
      {onSetTopics && (
        <>
          <ul className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            <AnimatePresence initial={false}>
              {topics.map((topicItem, i) => (
                <motion.li
                  key={`${i}-${topicItem}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 group"
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <span className="text-xs font-bold text-[#BA3033]/50 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{topicItem}</span>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded text-gray-300 group-hover:text-[#BA3033] cursor-pointer transition-colors shrink-0"
                    onClick={() => handleRemoveTopic(i)}
                    aria-label={`Remove: ${topicItem}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Add input — always visible */}
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={topics.length > 0 ? t("host.addMoreTopics") : t("host.addTopicsOneLine")}
              rows={1}
              className="flex-1 px-3 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all resize-none"
            />
            <motion.button
              className="px-3 py-2 rounded-xl bg-[#BA3033] text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddTopics}
              disabled={inputText.trim().length === 0}
            >
              {t("host.addButton")}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
