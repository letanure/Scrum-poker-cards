import { useCallback } from "react";
import { motion } from "framer-motion";

interface TopicSummaryProps {
  topicResults: Record<
    number,
    { topic: string; votes: Record<string, string>; average: number | null }
  >;
  players: Array<{ id: string; name: string }>;
}

export function TopicSummary({ topicResults, players }: TopicSummaryProps) {
  const sortedIndices = Object.keys(topicResults)
    .map(Number)
    .sort((a, b) => a - b);

  const handleCopyToClipboard = useCallback(() => {
    const playerNames = players.map((p) => p.name);
    const header = `| # | Topic | Average | ${playerNames.join(" | ")} |`;
    const separator = `|---|-------|---------|${playerNames.map(() => "---").join("|")}|`;

    const rows = sortedIndices.map((idx) => {
      const result = topicResults[idx];
      const avg =
        result.average !== null ? result.average.toFixed(1) : "-";
      const playerVotes = players.map(
        (p) => result.votes[p.id] ?? "-",
      );
      return `| ${idx + 1} | ${result.topic} | ${avg} | ${playerVotes.join(" | ")} |`;
    });

    const markdown = [header, separator, ...rows].join("\n");
    void navigator.clipboard.writeText(markdown);
  }, [topicResults, players, sortedIndices]);

  if (sortedIndices.length === 0) return null;

  return (
    <motion.div
      id="topic-summary"
      className="flex flex-col gap-3 p-4 rounded-2xl bg-white/90 shadow-md border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#BA3033]">Topic Summary</h3>
        <motion.button
          className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyToClipboard}
        >
          Copy to clipboard
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F8ABAA]/30">
              <th className="py-2 px-2 text-left text-xs font-bold text-gray-500 w-8">
                #
              </th>
              <th className="py-2 px-2 text-left text-xs font-bold text-gray-500">
                Topic
              </th>
              <th className="py-2 px-2 text-center text-xs font-bold text-gray-500 w-16">
                Avg
              </th>
              {players.map((p) => (
                <th
                  key={p.id}
                  className="py-2 px-2 text-center text-xs font-bold text-gray-500 w-16"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedIndices.map((idx) => {
              const result = topicResults[idx];
              return (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="py-2 px-2 text-xs text-gray-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 text-gray-700 truncate max-w-[200px]">
                    {result.topic}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-[#BA3033]">
                    {result.average !== null
                      ? result.average.toFixed(1)
                      : "-"}
                  </td>
                  {players.map((p) => (
                    <td
                      key={p.id}
                      className="py-2 px-2 text-center text-gray-600"
                    >
                      {result.votes[p.id] ?? "-"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
