import { useState, useCallback, useRef } from "react";
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
} from "../lib/protocol.ts";

const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? "localhost:1999";

export function usePokerRoom(roomId: string, playerName: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voteVersions, setVoteVersions] = useState<Record<string, number>>({});
  const playerIdRef = useRef<string>("");

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen(event) {
      const ws = event.target;
      if (ws instanceof WebSocket) {
        // partysocket sets id on the instance
        const ps = ws as unknown as { id?: string };
        if (ps.id) {
          playerIdRef.current = ps.id;
        }
      }

      // Also grab id from the partysocket instance directly
      if (socket.id) {
        playerIdRef.current = socket.id;
      }

      setIsConnected(true);

      const joinMsg: JoinMessage = { type: "join", name: playerName };
      socket.send(JSON.stringify(joinMsg));
    },
    onMessage(event) {
      const message: ServerMessage = JSON.parse(
        event.data as string,
      ) as ServerMessage;

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
            const { [message.playerId]: _, ...remainingVotes } = prev.votes;
            void _;
            return {
              ...prev,
              players,
              votes: remainingVotes,
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
              votedPlayerIds: [],
              topic: message.topic ?? prev.topic,
              players: prev.players.map((p) => ({ ...p, hasVoted: false })),
            };
          });
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

  // Capture player id once socket is available
  if (socket.id && !playerIdRef.current) {
    playerIdRef.current = socket.id;
  }

  const vote = useCallback(
    (value: string) => {
      const msg: VoteMessage = { type: "vote", value };
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

  return {
    state,
    isConnected,
    vote,
    reveal,
    newRound,
    setTopic,
    configure,
    playerId: playerIdRef.current,
    voteVersions,
  };
}
