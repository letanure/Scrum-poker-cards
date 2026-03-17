import { useState, useCallback, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopicInputProps {
  topics: string[];
  onSetTopics: (topics: string[]) => void;
}

export function TopicInput({ topics, onSetTopics }: TopicInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [textValue, setTextValue] = useState("");

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setTextValue(e.target.value);
    },
    [],
  );

  const handleAdd = useCallback(() => {
    const newTopics = textValue
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (newTopics.length === 0) return;
    onSetTopics([...topics, ...newTopics]);
    setTextValue("");
  }, [textValue, topics, onSetTopics]);

  const handleRemoveTopic = useCallback(
    (index: number) => {
      const updated = topics.filter((_, i) => i !== index);
      onSetTopics(updated);
    },
    [topics, onSetTopics],
  );

  const handleClearAll = useCallback(() => {
    onSetTopics([]);
  }, [onSetTopics]);

  return (
    <motion.div
      id="topic-input"
      className="flex flex-col gap-2 p-4 rounded-2xl bg-white/90 shadow-md border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <button
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#BA3033] cursor-pointer transition-colors w-full text-left"
        onClick={handleToggle}
      >
        <span
          className="text-xs transition-transform"
          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          &#9654;
        </span>
        <span>Add topics (optional)</span>
        {topics.length > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#BA3033] text-white text-xs font-bold">
            {topics.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-2">
              <textarea
                value={textValue}
                onChange={handleTextChange}
                placeholder="Paste topics here, one per line..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-[#F8ABAA]/50 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all resize-y"
              />
              <motion.button
                className="self-start px-4 py-1.5 rounded-lg bg-[#BA3033] text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                disabled={textValue.trim().length === 0}
              >
                Add
              </motion.button>
            </div>

            {topics.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    Current topics
                  </span>
                  <button
                    className="text-xs text-[#BA3033] hover:underline cursor-pointer"
                    onClick={handleClearAll}
                  >
                    Clear all
                  </button>
                </div>
                <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {topics.map((topic, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-700"
                    >
                      <span className="text-xs font-bold text-gray-400 w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="flex-1 truncate">{topic}</span>
                      <button
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#BA3033] hover:bg-red-50 cursor-pointer text-xs font-bold transition-colors"
                        onClick={() => handleRemoveTopic(i)}
                        aria-label={`Remove topic: ${topic}`}
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
