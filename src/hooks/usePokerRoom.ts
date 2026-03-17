import { useState, useCallback, useEffect, useRef } from "react";
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
  TransferHostMessage,
  ConfidenceLevel,
} from "../lib/protocol.ts";

const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? "localhost:1999";

function getOrCreateStableId(): string {
  const existing = localStorage.getItem("poker-player-id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("poker-player-id", id);
  return id;
}

export function usePokerRoom(roomId: string, playerName: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voteVersions, setVoteVersions] = useState<Record<string, number>>({});
  const [kicked, setKicked] = useState(() => {
    const kickedRooms = localStorage.getItem("poker-kicked-rooms");
    if (kickedRooms) {
      const rooms: unknown = JSON.parse(kickedRooms);
      if (Array.isArray(rooms) && rooms.includes(roomId)) return true;
    }
    return false;
  });

  const stableId = useRef(getOrCreateStableId()).current;
  const tabIdRef = useRef(`${Date.now()}-${Math.random()}`);
  const pausedByTabRef = useRef(false);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen() {
      setIsConnected(true);

      const joinMsg: JoinMessage = { type: "join", name: playerName, stableId };
      socket.send(JSON.stringify(joinMsg));

      // Tell other tabs this one is now active
      try {
        const channel = new BroadcastChannel(`poker-room-${roomId}`);
        channel.postMessage({ type: "tab-active", tabId: tabIdRef.current });
        channel.close();
      } catch { /* BroadcastChannel not supported */ }
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
          try {
            const existing = localStorage.getItem("poker-kicked-rooms");
            const rooms: string[] = existing ? JSON.parse(existing) as string[] : [];
            if (!rooms.includes(roomId)) {
              rooms.push(roomId);
              localStorage.setItem("poker-kicked-rooms", JSON.stringify(rooms));
            }
          } catch { /* ignore storage errors */ }
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

  // BroadcastChannel: coordinate between tabs
  useEffect(() => {
    if (kicked) return;

    const channel = new BroadcastChannel(`poker-room-${roomId}`);

    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type: string; tabId: string };
      if (data.type === "tab-active" && data.tabId !== tabIdRef.current) {
        // Another tab became active — close our socket
        pausedByTabRef.current = true;
        setIsConnected(false);
        socket.close();
      }
    };

    return () => channel.close();
  }, [roomId, kicked, socket]);

  // On focus: reclaim the connection if paused by another tab
  useEffect(() => {
    if (kicked) return;

    const handleFocus = () => {
      if (!pausedByTabRef.current) return;
      pausedByTabRef.current = false;

      // Tell other tabs we're taking over
      try {
        const channel = new BroadcastChannel(`poker-room-${roomId}`);
        channel.postMessage({ type: "tab-active", tabId: tabIdRef.current });
        channel.close();
      } catch { /* ignore */ }

      socket.reconnect();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [socket, kicked, roomId]);

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

  const transferHost = useCallback(
    (targetPlayerId: string) => {
      const msg: TransferHostMessage = { type: "transfer-host", playerId: targetPlayerId };
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
    playerId: stableId,
    voteVersions,
    kicked,
    kick,
    transferHost,
  };
}
