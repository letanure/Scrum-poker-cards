// Confidence levels
export const CONFIDENCE_LEVELS = {
  confident: "confident",
  guessing: "guessing",
  noIdea: "no-idea",
} as const;

export type ConfidenceLevel =
  (typeof CONFIDENCE_LEVELS)[keyof typeof CONFIDENCE_LEVELS];

// Room phases
export const ROOM_PHASES = {
  waiting: "waiting",
  voting: "voting",
  revealed: "revealed",
} as const;

export type RoomPhase = (typeof ROOM_PHASES)[keyof typeof ROOM_PHASES];

// Player
export type Player = {
  id: string;
  name: string;
  color: string;
  hasVoted: boolean;
};

// Room config
export type RoomConfig = {
  cards: string[];
  autoReveal: boolean;
};

// Room state
export type RoomState = {
  phase: RoomPhase;
  hostId: string;
  topic: string;
  players: Player[];
  votes: Record<string, string>;
  confidences: Record<string, ConfidenceLevel>;
  votedPlayerIds: string[];
  config: RoomConfig;
  explanations: Record<string, string>;
};

// --- Client → Server messages ---

export type JoinMessage = {
  type: "join";
  name: string;
};

export type VoteMessage = {
  type: "vote";
  value: string;
  confidence: ConfidenceLevel;
};

export type RevealMessage = {
  type: "reveal";
};

export type NewRoundMessage = {
  type: "new-round";
  topic?: string;
};

export type SetTopicMessage = {
  type: "set-topic";
  topic: string;
};

export type ConfigureMessage = {
  type: "configure";
  cards: string[];
  autoReveal: boolean;
};

export type ExplainMessage = {
  type: "explain";
  text: string;
};

export type ClientMessage =
  | JoinMessage
  | VoteMessage
  | RevealMessage
  | NewRoundMessage
  | SetTopicMessage
  | ConfigureMessage
  | ExplainMessage;

// --- Server → Client messages ---

export type SyncMessage = {
  type: "sync";
  state: RoomState;
};

export type PlayerJoinedMessage = {
  type: "player-joined";
  player: Player;
};

export type PlayerLeftMessage = {
  type: "player-left";
  playerId: string;
};

export type PlayerVotedMessage = {
  type: "player-voted";
  playerId: string;
};

export type RevealedMessage = {
  type: "revealed";
  votes: Record<string, string>;
  confidences: Record<string, ConfidenceLevel>;
};

export type NewRoundServerMessage = {
  type: "new-round";
  topic?: string;
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type ExplanationMessage = {
  type: "explanation";
  playerId: string;
  text: string;
};

export type ServerMessage =
  | SyncMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerVotedMessage
  | RevealedMessage
  | NewRoundServerMessage
  | ErrorMessage
  | ExplanationMessage;
