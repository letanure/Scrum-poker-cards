import type * as Party from "partykit/server";

const PLAYER_COLORS = [
  "#E74C3C",
  "#3498DB",
  "#2ECC71",
  "#F39C12",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#FF5722",
  "#607D8B",
] as const;

const PHASES = {
  waiting: "waiting",
  voting: "voting",
  revealed: "revealed",
} as const;

type Phase = (typeof PHASES)[keyof typeof PHASES];

interface Player {
  id: string;
  name: string;
  color: string;
  hasVoted: boolean;
}

interface RoomConfig {
  cards: string[];
  autoReveal: boolean;
}

interface SerializedRoomState {
  phase: Phase;
  hostId: string;
  topic: string;
  players: Player[];
  votes: Record<string, string>;
  votedPlayerIds: string[];
  config: RoomConfig;
}

// Client → Server messages
interface JoinMessage {
  type: "join";
  name: string;
}

interface VoteMessage {
  type: "vote";
  value: string;
}

interface RevealMessage {
  type: "reveal";
}

interface NewRoundMessage {
  type: "new-round";
  topic?: string;
}

interface SetTopicMessage {
  type: "set-topic";
  topic: string;
}

interface ConfigureMessage {
  type: "configure";
  cards: string[];
  autoReveal: boolean;
}

type ClientMessage =
  | JoinMessage
  | VoteMessage
  | RevealMessage
  | NewRoundMessage
  | SetTopicMessage
  | ConfigureMessage;

// Server → Client messages
interface SyncMessage {
  type: "sync";
  state: SerializedRoomState;
}

interface PlayerJoinedMessage {
  type: "player-joined";
  player: Player;
}

interface PlayerLeftMessage {
  type: "player-left";
  playerId: string;
}

interface PlayerVotedMessage {
  type: "player-voted";
  playerId: string;
}

interface RevealedMessage {
  type: "revealed";
  votes: Record<string, string>;
}

interface NewRoundBroadcastMessage {
  type: "new-round";
  topic?: string;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

type ServerMessage =
  | SyncMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerVotedMessage
  | RevealedMessage
  | NewRoundBroadcastMessage
  | ErrorMessage;

function serialize(message: ServerMessage): string {
  return JSON.stringify(message);
}

export default class PokerServer implements Party.Server {
  private phase: Phase = PHASES.waiting;
  private hostId = "";
  private topic = "";
  private players: Map<string, Player> = new Map();
  private votes: Map<string, string> = new Map();
  private config: RoomConfig = {
    cards: ["1", "2", "3", "5", "8", "13", "20", "40", "100", "infinity", "?", "coffee"],
    autoReveal: false,
  };
  private colorIndex = 0;

  constructor(readonly room: Party.Room) {}

  private getNextColor(): string {
    const color = PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length];
    this.colorIndex++;
    return color;
  }

  private serializeState(): SerializedRoomState {
    const players: Player[] = [];
    for (const player of this.players.values()) {
      players.push(player);
    }

    const votes: Record<string, string> = {};
    for (const [playerId, value] of this.votes.entries()) {
      votes[playerId] = value;
    }

    const votedPlayerIds: string[] = [];
    for (const [playerId, player] of this.players.entries()) {
      if (player.hasVoted) {
        votedPlayerIds.push(playerId);
      }
    }

    return {
      phase: this.phase,
      hostId: this.hostId,
      topic: this.topic,
      players,
      votes: this.phase === "revealed" ? votes : {},
      votedPlayerIds,
      config: this.config,
    };
  }

  private broadcastSync(): void {
    const message = serialize({ type: "sync", state: this.serializeState() });
    this.room.broadcast(message);
  }

  private sendError(conn: Party.Connection, message: string): void {
    conn.send(serialize({ type: "error", message }));
  }

  private isHost(connectionId: string): boolean {
    return this.hostId === connectionId;
  }

  private promoteNextHost(): void {
    const playerIds = [...this.players.keys()];
    if (playerIds.length > 0) {
      this.hostId = playerIds[0];
    } else {
      this.hostId = "";
    }
  }

  private checkAutoReveal(): void {
    if (!this.config.autoReveal) return;
    if (this.phase !== PHASES.voting) return;

    const allVoted = [...this.players.values()].every(
      (player) => player.hasVoted
    );

    if (allVoted && this.players.size > 0) {
      this.triggerReveal();
    }
  }

  private triggerReveal(): void {
    this.phase = PHASES.revealed;

    const votes: Record<string, string> = {};
    for (const [playerId, value] of this.votes.entries()) {
      votes[playerId] = value;
    }

    this.room.broadcast(serialize({ type: "revealed", votes }));
  }

  private handleJoin(sender: Party.Connection, msg: JoinMessage): void {
    const player: Player = {
      id: sender.id,
      name: msg.name,
      color: this.getNextColor(),
      hasVoted: false,
    };

    this.players.set(sender.id, player);

    // First player becomes host
    if (this.players.size === 1) {
      this.hostId = sender.id;
      if (this.phase === PHASES.waiting) {
        this.phase = PHASES.voting;
      }
    }

    // Send full state to the joiner
    sender.send(serialize({ type: "sync", state: this.serializeState() }));

    // Broadcast player-joined to others
    this.room.broadcast(
      serialize({ type: "player-joined", player }),
      [sender.id]
    );
  }

  private handleVote(sender: Party.Connection, msg: VoteMessage): void {
    if (this.phase !== PHASES.voting) {
      this.sendError(sender, "Voting is not active");
      return;
    }

    const player = this.players.get(sender.id);
    if (!player) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    this.votes.set(sender.id, msg.value);
    player.hasVoted = true;

    this.room.broadcast(
      serialize({ type: "player-voted", playerId: sender.id })
    );

    this.checkAutoReveal();
  }

  private handleReveal(sender: Party.Connection): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can reveal votes");
      return;
    }

    if (this.phase !== PHASES.voting) {
      this.sendError(sender, "Cannot reveal outside of voting phase");
      return;
    }

    this.triggerReveal();
  }

  private handleNewRound(sender: Party.Connection, msg: NewRoundMessage): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can start a new round");
      return;
    }

    this.votes.clear();
    for (const player of this.players.values()) {
      player.hasVoted = false;
    }

    if (msg.topic !== undefined) {
      this.topic = msg.topic;
    }

    this.phase = PHASES.voting;

    this.room.broadcast(
      serialize({ type: "new-round", topic: msg.topic })
    );
  }

  private handleSetTopic(sender: Party.Connection, msg: SetTopicMessage): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can set the topic");
      return;
    }

    this.topic = msg.topic;
    this.broadcastSync();
  }

  private handleConfigure(
    sender: Party.Connection,
    msg: ConfigureMessage
  ): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can configure the room");
      return;
    }

    this.config = {
      cards: msg.cards,
      autoReveal: msg.autoReveal,
    };

    this.broadcastSync();
  }

  onConnect(conn: Party.Connection): void {
    // Connection established but player not yet "joined" until they send a join message
  }

  onMessage(message: string, sender: Party.Connection): void {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      this.sendError(sender, "Invalid message format");
      return;
    }

    switch (parsed.type) {
      case "join":
        this.handleJoin(sender, parsed);
        break;
      case "vote":
        this.handleVote(sender, parsed);
        break;
      case "reveal":
        this.handleReveal(sender);
        break;
      case "new-round":
        this.handleNewRound(sender, parsed);
        break;
      case "set-topic":
        this.handleSetTopic(sender, parsed);
        break;
      case "configure":
        this.handleConfigure(sender, parsed);
        break;
      default:
        this.sendError(sender, "Unknown message type");
    }
  }

  onClose(conn: Party.Connection): void {
    const player = this.players.get(conn.id);
    if (!player) return;

    this.players.delete(conn.id);
    this.votes.delete(conn.id);

    const wasHost = this.isHost(conn.id);
    if (wasHost) {
      this.promoteNextHost();
    }

    this.room.broadcast(
      serialize({ type: "player-left", playerId: conn.id })
    );

    // If host changed, broadcast full sync so everyone knows the new host
    if (wasHost && this.hostId !== "") {
      this.broadcastSync();
    }
  }
}
