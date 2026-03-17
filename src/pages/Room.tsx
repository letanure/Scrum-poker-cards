import { useState, useCallback, useRef, useEffect, useMemo, type ChangeEvent } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerRoom } from "../hooks/usePokerRoom.ts";
import { Table } from "../components/Table.tsx";
import { CardHand } from "../components/CardHand.tsx";
import { Results } from "../components/Results.tsx";
import { HostControls } from "../components/HostControls.tsx";
import { ShareButton } from "../components/ShareButton.tsx";
import { TopicBar } from "../components/TopicBar.tsx";

import { TopicSummary } from "../components/TopicSummary.tsx";
import { PRESETS, PRESET_LABELS, type PresetName } from "../lib/cards.ts";
import { CONFIDENCE_LEVELS, type ConfidenceLevel } from "../lib/protocol.ts";

function NameModal({
  onSubmit,
}: {
  onSubmit: (name: string) => void;
}) {
  const [inputName, setInputName] = useState("");

  const handleSubmit = useCallback(() => {
    if (inputName.trim()) {
      onSubmit(inputName.trim());
    }
  }, [inputName, onSubmit]);

  return (
    <div id="room__name-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        id="room__name-modal__card"
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-lg font-bold text-[#BA3033] text-center">
          Enter your name
        </h2>
        <input
          type="text"
          value={inputName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInputName(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Your name..."
          className="w-full px-4 py-3 rounded-xl border border-[#F8ABAA]/50 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-[#BA3033] focus:ring-2 focus:ring-[#BA3033]/20 transition-all text-sm"
          maxLength={30}
          autoFocus
        />
        <motion.button
          className="w-full px-6 py-3 rounded-xl bg-[#BA3033] text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: inputName.trim() ? 1.02 : 1 }}
          whileTap={{ scale: inputName.trim() ? 0.98 : 1 }}
          onClick={handleSubmit}
          disabled={!inputName.trim()}
        >
          Join Room
        </motion.button>
      </motion.div>
    </div>
  );
}

function ConfigPanel({
  currentCards,
  autoReveal,
  onConfigure,
}: {
  currentCards: string[];
  autoReveal: boolean;
  onConfigure: (cards: string[], autoReveal: boolean) => void;
}) {
  const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

  const activePreset = useMemo(() => {
    for (const presetName of PRESET_NAMES) {
      const presetCards = PRESETS[presetName];
      if (
        presetCards.length === currentCards.length &&
        presetCards.every((c, i) => c === currentCards[i])
      ) {
        return presetName;
      }
    }
    return null;
  }, [currentCards, PRESET_NAMES]);

  return (
    <motion.div
      id="room__config-panel"
      className="flex flex-col gap-3 p-4 rounded-2xl bg-white/90 shadow-md border border-[#F8ABAA]/30 backdrop-blur-sm w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <h3 className="text-sm font-bold text-gray-600">Room Settings</h3>

      <div id="room__config-panel__presets" className="flex flex-wrap gap-2">
        {PRESET_NAMES.map((presetName) => (
          <motion.button
            key={presetName}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activePreset === presetName
                ? "bg-[#BA3033] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              onConfigure([...PRESETS[presetName]], autoReveal)
            }
          >
            {PRESET_LABELS[presetName]}
          </motion.button>
        ))}
      </div>

      <label id="room__config-panel__auto-reveal" className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoReveal}
          onChange={(e) => onConfigure(currentCards, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#BA3033] focus:ring-[#BA3033]"
        />
        <span className="text-xs text-gray-600 font-medium">
          Auto-reveal when all vote
        </span>
      </label>
    </motion.div>
  );
}

const CONFIDENCE_OPTIONS = [
  { value: CONFIDENCE_LEVELS.confident, label: "Confident", emoji: "\uD83D\uDE0E", color: "#94A979", bgColor: "#94A979/20" },
  { value: CONFIDENCE_LEVELS.guessing, label: "Guessing", emoji: "\uD83E\uDD14", color: "#F39C12", bgColor: "#F39C12/20" },
  { value: CONFIDENCE_LEVELS.noIdea, label: "No idea", emoji: "\uD83E\uDD37", color: "#E74C3C", bgColor: "#E74C3C/20" },
] as const;

function ConfidenceToggle({
  selected,
  onSelect,
}: {
  selected: ConfidenceLevel;
  onSelect: (level: ConfidenceLevel) => void;
}) {
  return (
    <div id="room__confidence-toggle" className="flex items-center justify-center gap-2 py-2">
      {CONFIDENCE_OPTIONS.map((option) => {
        const isActive = selected === option.value;
        return (
          <motion.button
            key={option.value}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
              isActive
                ? "text-white shadow-md"
                : "bg-white/80 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
            style={isActive ? { backgroundColor: option.color, borderColor: option.color } : undefined}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(option.value)}
          >
            <span>{option.emoji}</span>
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const rawState: unknown = location.state;
  const locationPlayerName =
    rawState !== null &&
    typeof rawState === "object" &&
    "playerName" in rawState &&
    typeof (rawState as Record<string, unknown>)["playerName"] === "string"
      ? String((rawState as Record<string, unknown>)["playerName"])
      : null;

  const preset: PresetName =
    rawState !== null &&
    typeof rawState === "object" &&
    "preset" in rawState &&
    typeof (rawState as Record<string, unknown>)["preset"] === "string" &&
    Object.hasOwn(PRESETS, (rawState as Record<string, unknown>)["preset"] as string)
      ? ((rawState as Record<string, unknown>)["preset"] as PresetName)
      : "all";

  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (locationPlayerName) return locationPlayerName;
    return localStorage.getItem("poker-name");
  });

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.setItem("poker-name", name);
    setPlayerName(name);
  }, []);

  // Don't connect until we have a name
  if (!playerName) {
    return <NameModal onSubmit={handleNameSubmit} />;
  }

  return (
    <RoomInner
      roomId={roomId ?? ""}
      playerName={playerName}
      preset={preset}
    />
  );
}

function RoomInner({
  roomId,
  playerName,
  preset,
}: {
  roomId: string;
  playerName: string;
  preset: PresetName;
}) {

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel>(CONFIDENCE_LEVELS.confident);
  const [shout, setShout] = useState<{ text: string; explanation?: string; version: number } | null>(null);
  const [kickConfirm, setKickConfirm] = useState<{ playerId: string; name: string } | null>(null);
  const [hostConfirm, setHostConfirm] = useState<{ playerId: string; name: string } | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [hostToast, setHostToast] = useState(false);
  const prevHostIdRef = useRef<string | null>(null);

  const shoutVersionRef = useRef(0);

  const handleCardDescription = useCallback((description: string, explanation?: string) => {
    shoutVersionRef.current += 1;
    setShout({
      text: description,
      explanation,
      version: shoutVersionRef.current,
    });
    const capturedVersion = shoutVersionRef.current;
    setTimeout(() => {
      setShout((current) => {
        if (current?.version === capturedVersion) return null;
        return current;
      });
    }, 3000);
  }, []);

  const {
    state,
    isConnected,
    vote,
    reveal,
    newRound,
    setTopic,
    configure,
    explain,
    setTopics,
    nextTopic,
    prevTopic,
    playerId,
    voteVersions,
    kicked,
    replaced,
    kick,
    transferHost,
  } = usePokerRoom(roomId, playerName);

  const initialConfigSentRef = useRef(false);

  // Detect when user becomes host
  useEffect(() => {
    if (!state || !playerId) return;
    const wasHost = prevHostIdRef.current === playerId;
    const isNowHost = state.hostId === playerId;
    if (!wasHost && isNowHost && prevHostIdRef.current !== null) {
      setHostToast(true);
      setTimeout(() => setHostToast(false), 3000);
    }
    prevHostIdRef.current = state.hostId;
  }, [state?.hostId, playerId, state]);

  useEffect(() => {
    if (
      !initialConfigSentRef.current &&
      state &&
      isConnected &&
      state.hostId === playerId &&
      (state.phase === "waiting" || state.phase === "voting")
    ) {
      initialConfigSentRef.current = true;
      configure([...PRESETS[preset]], state.config.autoReveal);
    }
  }, [state, isConnected, playerId, preset, configure]);

  const handleVote = useCallback(
    (value: string) => {
      setSelectedCard(value);
      vote(value, selectedConfidence);
    },
    [vote, selectedConfidence],
  );

  const handleNewRound = useCallback(() => {
    setSelectedCard(null);
    setSelectedConfidence(CONFIDENCE_LEVELS.confident);
    newRound();
  }, [newRound]);

  const handleNextTopic = useCallback(() => {
    setSelectedCard(null);
    setSelectedConfidence(CONFIDENCE_LEVELS.confident);
    nextTopic();
  }, [nextTopic]);

  const handleKickClick = useCallback(
    (targetPlayerId: string) => {
      const player = state?.players.find((p) => p.id === targetPlayerId);
      if (player) {
        setKickConfirm({ playerId: targetPlayerId, name: player.name });
      }
    },
    [state?.players],
  );

  const handleKickConfirm = useCallback(() => {
    if (kickConfirm) {
      kick(kickConfirm.playerId);
      setKickConfirm(null);
    }
  }, [kick, kickConfirm]);

  const handleKickCancel = useCallback(() => {
    setKickConfirm(null);
  }, []);

  const handleMakeHostClick = useCallback(
    (targetPlayerId: string) => {
      const player = state?.players.find((p) => p.id === targetPlayerId);
      if (player) {
        setHostConfirm({ playerId: targetPlayerId, name: player.name });
      }
    },
    [state?.players],
  );

  const handleHostConfirm = useCallback(() => {
    if (hostConfirm) {
      transferHost(hostConfirm.playerId);
      setHostConfirm(null);
    }
  }, [transferHost, hostConfirm]);

  if (kicked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8ABAA]/20 via-white to-[#F0649B]/10 flex items-center justify-center px-4">
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <span className="text-4xl">👋</span>
          <h2 className="text-lg font-bold text-[#BA3033]">
            You were removed from this session
          </h2>
          <p className="text-sm text-gray-500">
            The host has removed you from the room.
          </p>
          <Link
            to="/"
            className="mt-2 px-6 py-3 rounded-xl bg-[#BA3033] text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (replaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8ABAA]/20 via-white to-[#F0649B]/10 flex items-center justify-center px-4">
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
        >
          <span className="text-2xl">💤</span>
          <p className="text-sm text-gray-400">
            Active in another tab — click here to switch
          </p>
        </motion.div>
      </div>
    );
  }

  if (!state || !isConnected) {
    return (
      <div id="room__loading" className="min-h-screen bg-gradient-to-br from-[#F8ABAA]/20 via-white to-[#F0649B]/10 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full border-4 border-[#F8ABAA] border-t-[#BA3033]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-gray-500 font-medium">
            Connecting to room...
          </p>
        </motion.div>
      </div>
    );
  }

  const isHost = state.hostId === playerId;
  const isVoting = state.phase === "voting";
  const isRevealed = state.phase === "revealed";
  const isWaiting = state.phase === "waiting";

  const tablePlayers = state.players.map((p) => ({
    ...p,
    isHost: p.id === state.hostId,
  }));

  const revealedVotes = isRevealed ? state.votes : null;

  const hasTopics = state.topics.length > 0;
  const isLastTopic = state.currentTopicIndex >= state.topics.length - 1;
  const allTopicsDone =
    hasTopics &&
    state.currentTopicIndex >= state.topics.length &&
    isRevealed;

  return (
    <div id="room" className="min-h-screen bg-gradient-to-br from-[#F8ABAA]/20 via-white to-[#F0649B]/10 flex flex-col">
      {/* Top bar */}
      <header id="room__header" className="flex items-center justify-between px-4 py-3 border-b border-[#F8ABAA]/30 bg-white/80 backdrop-blur-sm z-20">
        <div id="room__header__info" className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#BA3033] font-[Nunito]">
            Scrum Poker
          </h1>
          {state.topic && !hasTopics && (
            <span className="text-sm text-gray-500 truncate max-w-[200px]">
              — {state.topic}
            </span>
          )}
        </div>
        <div id="room__header__actions" className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">
            {state.players.length} player{state.players.length !== 1 ? "s" : ""}
          </span>
          <ShareButton roomId={roomId} />
        </div>
      </header>

      {/* Body: main + optional side panel */}
      <div className="flex-1 flex w-full">
      <main id="room__main" className="flex-1 flex flex-col items-center gap-4 px-4 py-4 min-w-0">
        {/* Topic bar */}
        {(isHost || hasTopics) && (
          <div className="w-full max-w-3xl">
            <TopicBar
              topics={state.topics}
              currentTopicIndex={state.currentTopicIndex}
              isHost={isHost}
              onPrev={prevTopic}
              onNext={handleNextTopic}
              onToggleEdit={isHost ? () => setSidePanelOpen((prev) => !prev) : undefined}
              isEditing={sidePanelOpen}
            />
          </div>
        )}
          {/* Config panel for host in waiting phase */}
          {isHost && isWaiting && (
            <ConfigPanel
              currentCards={state.config.cards}
              autoReveal={state.config.autoReveal}
              onConfigure={configure}
            />
          )}

        {/* Table */}
        <Table
          players={tablePlayers}
          currentUserId={playerId}
          revealedVotes={revealedVotes}
          voteVersions={voteVersions}
          isHost={isHost}
          onReveal={reveal}
          onNewRound={handleNewRound}
          onNextTopic={handleNextTopic}
          onKick={isHost ? handleKickClick : undefined}
          onMakeHost={isHost ? handleMakeHostClick : undefined}
          hasTopics={hasTopics}
          isLastTopic={isLastTopic}
          phase={state.phase}
        />

        {/* Results */}
        <AnimatePresence>
          {isRevealed && Object.keys(state.votes).length > 0 && (
            <Results
              votes={state.votes}
              players={state.players}
              confidences={state.confidences}
              explanations={state.explanations}
              currentUserId={playerId}
              onExplain={explain}
            />
          )}
        </AnimatePresence>

        {/* Topic summary when all topics are done */}
        {allTopicsDone && (
          <TopicSummary
            topicResults={state.topicResults}
            players={state.players}
          />
        )}

        {/* Card description shout — bubbles up from the bottom */}
        <AnimatePresence>
          {shout && (
            <motion.div
              key={`shout-${shout.version}`}
              id="room__main__shout"
              className="pointer-events-none text-center"
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: [0, 0.5, 0.5, 0], y: -80 }}
              transition={{ duration: 3, ease: "easeOut", times: [0, 0.1, 0.6, 1] }}
            >
              <span
                className="text-4xl sm:text-6xl font-extrabold italic select-none block"
                style={{ color: "rgba(186, 48, 51, 0.2)" }}
              >
                {`"${shout.text}!"`}
              </span>
              {shout.explanation && (
                <span
                  className="text-sm sm:text-base font-medium select-none block mt-1"
                  style={{ color: "rgba(186, 48, 51, 0.3)" }}
                >
                  {shout.explanation}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Inline side panel — pushes main content */}
      <AnimatePresence>
        {isHost && sidePanelOpen && (
          <motion.aside
            id="room__host-panel"
            className="w-72 shrink-0 border-l border-[#F8ABAA]/20 bg-white/60 flex flex-col"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-gray-700">Topics</span>
              <button
                className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setSidePanelOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <HostControls
                topic={state.topic}
                onSetTopic={setTopic}
                hasTopics={hasTopics}
                topics={state.topics}
                onSetTopics={setTopics}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      </div>

      {/* Card hand at bottom */}
      {(isVoting || isWaiting) && (
        <div id="room__hand-dock" className="sticky bottom-0 z-10" style={{ overflow: "visible" }}>
          <div id="room__hand-dock__bg" className="absolute inset-x-0 bottom-0 h-full bg-white/80 border-t border-[#F8ABAA]/30" />
          <div className="relative z-10">
            {isVoting && (
              <ConfidenceToggle
                selected={selectedConfidence}
                onSelect={setSelectedConfidence}
              />
            )}
            <div id="room__hand-dock__cards" style={{ overflow: "visible" }}>
              <CardHand
                cards={state.config.cards}
                selectedCard={selectedCard}
                onSelect={handleVote}
                onCardDescription={handleCardDescription}
                disabled={!isVoting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Kick confirmation modal */}
      <AnimatePresence>
        {kickConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <p className="text-sm font-semibold text-gray-700">
                Remove <span className="text-[#BA3033]">{kickConfirm.name}</span> from the room?
              </p>
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleKickCancel}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer hover:bg-red-600 transition-colors shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleKickConfirm}
                >
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer host confirmation modal */}
      <AnimatePresence>
        {hostConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <p className="text-sm font-semibold text-gray-700">
                Make <span className="text-[#7F6CB1]">{hostConfirm.name}</span> the new host?
              </p>
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setHostConfirm(null)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="flex-1 px-4 py-2 rounded-xl bg-[#7F6CB1] text-white font-semibold text-sm cursor-pointer hover:bg-[#6B5A9E] transition-colors shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHostConfirm}
                >
                  Transfer
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Host promotion toast */}
      <AnimatePresence>
        {hostToast && (
          <motion.div
            className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-5 py-3 rounded-xl bg-[#7F6CB1] text-white text-sm font-semibold shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            ⭐ You are now the host!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnected overlay */}
      {!isConnected && state && (
        <div id="room__disconnected" className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <p className="text-sm font-semibold text-[#BA3033]">
              Connection lost. Reconnecting...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
