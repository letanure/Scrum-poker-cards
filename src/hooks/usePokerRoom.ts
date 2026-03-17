import { useState, useCallback } from "react";
import usePartySocket from "partysocket/react";
import type {
  RoomState,
  ServerMessage,
  JoinMessage,
  VoteMessage,
  RevealMessage,
  NewRoundMessage,
  SetTopicMessage,
  ConfigureMessage,
  ExplainMessage,
  SetTopicsMessage,
  NextTopicMessage,
  PrevTopicMessage,
  KickMessage,
  ConfidenceLevel,
} from "../lib/protocol.ts";

const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? "localhost:1999";

export function usePokerRoom(roomId: string, playerName: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voteVersions, setVoteVersions] = useState<Record<string, number>>({});
  const [playerId, setPlayerId] = useState("");
  const [kicked, setKicked] = useState(false);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen() {
      if (socket.id) {
        setPlayerId(socket.id);
      }

      setIsConnected(true);

      const joinMsg: JoinMessage = { type: "join", name: playerName };
      socket.send(JSON.stringify(joinMsg));
    },
    onMessage(event) {
      const message = JSON.parse(String(event.data)) as ServerMessage;

      switch (message.type) {
        case "sync": {
          setState(message.state);
          break;
        }
        case "player-joined": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: [...prev.players, message.player],
            };
          });
          break;
        }
        case "player-left": {
          setState((prev) => {
            if (!prev) return prev;
            const players = prev.players.filter(
              (p) => p.id !== message.playerId,
            );
            const { [message.playerId]: _v, ...remainingVotes } = prev.votes;
            void _v;
            const { [message.playerId]: _c, ...remainingConfidences } = prev.confidences;
            void _c;
            const { [message.playerId]: _e, ...remainingExplanations } = prev.explanations;
            void _e;
            return {
              ...prev,
              players,
              votes: remainingVotes,
              confidences: remainingConfidences,
              explanations: remainingExplanations,
              votedPlayerIds: prev.votedPlayerIds.filter(
                (id) => id !== message.playerId,
              ),
            };
          });
          break;
        }
        case "player-voted": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === message.playerId ? { ...p, hasVoted: true } : p,
              ),
              votedPlayerIds: prev.votedPlayerIds.includes(message.playerId)
                ? prev.votedPlayerIds
                : [...prev.votedPlayerIds, message.playerId],
            };
          });
          setVoteVersions((prev) => ({
            ...prev,
            [message.playerId]: (prev[message.playerId] ?? 0) + 1,
          }));
          break;
        }
        case "revealed": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phase: "revealed",
              votes: message.votes,
              confidences: message.confidences,
            };
          });
          break;
        }
        case "new-round": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phase: "voting",
              votes: {},
              confidences: {},
              explanations: {},
              votedPlayerIds: [],
              topic: message.topic ?? prev.topic,
              players: prev.players.map((p) => ({ ...p, hasVoted: false })),
            };
          });
          break;
        }
        case "explanation": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              explanations: {
                ...prev.explanations,
                [message.playerId]: message.text,
              },
            };
          });
          break;
        }
        case "topics-updated": {
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              topics: message.topics,
              currentTopicIndex: message.currentTopicIndex,
            };
          });
          break;
        }
        case "kicked": {
          setKicked(true);
          break;
        }
        case "error": {
          console.error("[PokerRoom] Server error:", message.message);
          break;
        }
      }
    },
    onClose() {
      setIsConnected(false);
    },
    onError() {
      setIsConnected(false);
    },
  });

  // Ensure playerId is captured even if onOpen ran before state setter
  if (socket.id && !playerId) {
    setPlayerId(socket.id);
  }

  const vote = useCallback(
    (value: string, confidence: ConfidenceLevel) => {
      const msg: VoteMessage = { type: "vote", value, confidence };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const reveal = useCallback(() => {
    const msg: RevealMessage = { type: "reveal" };
    socket.send(JSON.stringify(msg));
  }, [socket]);

  const newRound = useCallback(
    (topic?: string) => {
      const msg: NewRoundMessage = { type: "new-round", topic };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const setTopic = useCallback(
    (topic: string) => {
      const msg: SetTopicMessage = { type: "set-topic", topic };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const configure = useCallback(
    (cards: string[], autoReveal: boolean) => {
      const msg: ConfigureMessage = { type: "configure", cards, autoReveal };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const explain = useCallback(
    (text: string) => {
      const msg: ExplainMessage = { type: "explain", text };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const setTopics = useCallback(
    (topics: string[]) => {
      const msg: SetTopicsMessage = { type: "set-topics", topics };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  const nextTopic = useCallback(() => {
    const msg: NextTopicMessage = { type: "next-topic" };
    socket.send(JSON.stringify(msg));
  }, [socket]);

  const prevTopic = useCallback(() => {
    const msg: PrevTopicMessage = { type: "prev-topic" };
    socket.send(JSON.stringify(msg));
  }, [socket]);

  const kick = useCallback(
    (targetPlayerId: string) => {
      const msg: KickMessage = { type: "kick", playerId: targetPlayerId };
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );

  return {
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
    kick,
  };
}
