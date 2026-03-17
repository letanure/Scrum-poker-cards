import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { generateRoomId } from "../lib/cards.ts";
import { Card } from "../components/Card.tsx";

export function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("poker-name") ?? "");
  const [joinLink, setJoinLink] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    localStorage.setItem("poker-name", name.trim());
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`, { state: { playerName: name.trim() } });
  }, [name, navigate]);

  const extractRoomId = (input: string): string | null => {
    // Handle full URL like https://host/room/some-room-id
    const urlMatch = /\/room\/([^/?#]+)/.exec(input);
    if (urlMatch) return urlMatch[1];
    // Handle plain room id
    if (input.trim() && !input.includes("/")) return input.trim();
    return null;
  };

  const handleJoin = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !joinLink.trim()) return;
      const roomId = extractRoomId(joinLink);
      if (!roomId) return;
      localStorage.setItem("poker-name", name.trim());
      navigate(`/room/${roomId}`, { state: { playerName: name.trim() } });
    },
    [name, joinLink, navigate],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8ABAA] via-[#F0649B] to-[#BA3033] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative cards */}
      <div className="absolute top-8 left-8 opacity-30 rotate-[-15deg] hidden md:block">
        <Card value="5" isFlipped={false} isSelected={false} size="lg" />
      </div>
      <div className="absolute top-16 right-12 opacity-30 rotate-[12deg] hidden md:block">
        <Card value="13" isFlipped={true} isSelected={false} size="lg" />
      </div>
      <div className="absolute bottom-12 left-16 opacity-30 rotate-[8deg] hidden md:block">
        <Card value="?" isFlipped={false} isSelected={false} size="lg" />
      </div>
      <div className="absolute bottom-8 right-8 opacity-30 rotate-[-10deg] hidden md:block">
        <Card value="8" isFlipped={true} isSelected={false} size="lg" />
      </div>

      {/* Main content */}
      <motion.div
        className="flex flex-col items-center gap-8 max-w-md w-full z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg font-[Nunito]">
            Scrum Poker Cards
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Estimate together, with style.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col gap-5">
          {/* Name input */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-sm font-semibold text-gray-600 mb-1.5"
            >
              Your name
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all text-sm"
              maxLength={30}
            />
          </div>

          {/* Create button */}
          <motion.button
            className="w-full px-6 py-3 rounded-xl bg-[#BA3033] text-white font-bold text-base shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: name.trim() ? 1.02 : 1 }}
            whileTap={{ scale: name.trim() ? 0.98 : 1 }}
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create New Session
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Join section */}
          {showJoin ? (
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                placeholder="Paste room link or ID..."
                className="w-full px-4 py-3 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#7F6CB1] focus:ring-2 focus:ring-[#7F6CB1]/20 transition-all text-sm"
              />
              <motion.button
                type="submit"
                className="w-full px-6 py-3 rounded-xl bg-[#7F6CB1] text-white font-bold text-base shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{
                  scale: name.trim() && joinLink.trim() ? 1.02 : 1,
                }}
                whileTap={{
                  scale: name.trim() && joinLink.trim() ? 0.98 : 1,
                }}
                disabled={!name.trim() || !joinLink.trim()}
              >
                Join Session
              </motion.button>
            </form>
          ) : (
            <motion.button
              className="w-full px-6 py-3 rounded-xl border-2 border-[#7F6CB1] text-[#7F6CB1] font-bold text-base cursor-pointer hover:bg-[#7F6CB1]/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoin(true)}
            >
              Join Existing Session
            </motion.button>
          )}
        </div>

        {/* Fun badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {["No signup", "Free forever", "Fun cards!"].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
