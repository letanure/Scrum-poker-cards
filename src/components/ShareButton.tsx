import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
  roomId: string;
}

export function ShareButton({ roomId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId]);

  return (
    <div className="relative inline-flex">
      <motion.button
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#F8ABAA]/50 text-sm font-medium text-[#BA3033] shadow-sm hover:shadow-md cursor-pointer transition-shadow"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCopy}
      >
        {/* Link icon */}
        <svg
          className="w-4 h-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" />
          <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
        </svg>
        Share Room
      </motion.button>

      {/* "Copied!" toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-[#94A979] text-white text-xs font-semibold shadow-md whitespace-nowrap"
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
