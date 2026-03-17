import { useState, useCallback, useRef, useEffect, useMemo, type ChangeEvent } from "react";
import { useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePokerRoom } from "../hooks/usePokerRoom.ts";
import { Table } from "../components/Table.tsx";
import { CardHand } from "../components/CardHand.tsx";
import { Results } from "../components/Results.tsx";
import { HostControls } from "../components/HostControls.tsx";
import { ShareButton } from "../components/ShareButton.tsx";
import { TopicBar } from "../components/TopicBar.tsx";
import { TopicInput } from "../components/TopicInput.tsx";
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

  const locationPreset: PresetName =
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

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel>(CONFIDENCE_LEVELS.confident);
  const [shout, setShout] = useState<{ text: string; explanation?: string; version: number } | null>(null);

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

  const effectiveRoomId = roomId ?? "";
  const effectiveName = playerName ?? "";

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
  } = usePokerRoom(effectiveRoomId, effectiveName);

  const initialConfigSentRef = useRef(false);

  useEffect(() => {
    if (
      !initialConfigSentRef.current &&
      state &&
      isConnected &&
      state.hostId === playerId &&
      (state.phase === "waiting" || state.phase === "voting")
    ) {
      initialConfigSentRef.current = true;
      configure([...PRESETS[locationPreset]], state.config.autoReveal);
    }
  }, [state, isConnected, playerId, locationPreset, configure]);

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.setItem("poker-name", name);
    setPlayerName(name);
  }, []);

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

  if (!playerName) {
    return <NameModal onSubmit={handleNameSubmit} />;
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
          {state.topic && (
            <span className="text-sm text-gray-500 truncate max-w-[200px]">
              {state.topic}
            </span>
          )}
        </div>
        <div id="room__header__actions" className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">
            {state.players.length} player{state.players.length !== 1 ? "s" : ""}
          </span>
          <ShareButton roomId={effectiveRoomId} />
        </div>
      </header>

      {/* Topic bar */}
      {hasTopics && (
        <div className="px-4 pt-2 max-w-3xl mx-auto w-full">
          <TopicBar
            topics={state.topics}
            currentTopicIndex={state.currentTopicIndex}
            isHost={isHost}
            onPrev={prevTopic}
            onNext={handleNextTopic}
          />
        </div>
      )}

      {/* Main content */}
      <main id="room__main" className="flex-1 flex flex-col items-center gap-4 px-4 py-4 max-w-3xl mx-auto w-full">
        {/* Host controls */}
        {isHost && (isVoting || isRevealed) && (state.phase === "voting" || state.phase === "revealed") && (
          <HostControls
            phase={state.phase}
            onReveal={reveal}
            onNewRound={handleNewRound}
            topic={state.topic}
            onSetTopic={setTopic}
            hasTopics={hasTopics}
            isLastTopic={isLastTopic}
            onNextTopic={handleNextTopic}
          />
        )}

        {/* Config panel for host in waiting phase */}
        {isHost && isWaiting && (
          <ConfigPanel
            currentCards={state.config.cards}
            autoReveal={state.config.autoReveal}
            onConfigure={configure}
          />
        )}

        {/* Topic input for host */}
        {isHost && (isWaiting || isVoting) && (
          <TopicInput
            topics={state.topics}
            onSetTopics={setTopics}
          />
        )}

        {/* Table */}
        <Table
          players={tablePlayers}
          currentUserId={playerId}
          revealedVotes={revealedVotes}
          voteVersions={voteVersions}
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
