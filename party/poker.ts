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

interface TopicResult {
  topic: string;
  votes: Record<string, string>;
  average: number | null;
}

interface SerializedRoomState {
  phase: Phase;
  hostId: string;
  topic: string;
  players: Player[];
  votes: Record<string, string>;
  confidences: Record<string, string>;
  votedPlayerIds: string[];
  config: RoomConfig;
  explanations: Record<string, string>;
  topics: string[];
  currentTopicIndex: number;
  topicResults: Record<number, TopicResult>;
}

// Client → Server messages
interface JoinMessage {
  type: "join";
  name: string;
}

interface VoteMessage {
  type: "vote";
  value: string;
  confidence: string;
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

interface ExplainMessage {
  type: "explain";
  text: string;
}

interface SetTopicsMessage {
  type: "set-topics";
  topics: string[];
}

interface NextTopicMessage {
  type: "next-topic";
}

interface PrevTopicMessage {
  type: "prev-topic";
}

interface KickMessage {
  type: "kick";
  playerId: string;
}

type ClientMessage =
  | JoinMessage
  | VoteMessage
  | RevealMessage
  | NewRoundMessage
  | SetTopicMessage
  | ConfigureMessage
  | ExplainMessage
  | SetTopicsMessage
  | NextTopicMessage
  | PrevTopicMessage
  | KickMessage;

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
  confidences: Record<string, string>;
}

interface NewRoundBroadcastMessage {
  type: "new-round";
  topic?: string;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

interface ExplanationMessage {
  type: "explanation";
  playerId: string;
  text: string;
}

interface TopicsUpdatedMessage {
  type: "topics-updated";
  topics: string[];
  currentTopicIndex: number;
}

interface KickedMessage {
  type: "kicked";
}

type ServerMessage =
  | SyncMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerVotedMessage
  | RevealedMessage
  | NewRoundBroadcastMessage
  | ErrorMessage
  | ExplanationMessage
  | TopicsUpdatedMessage
  | KickedMessage
  | { type: "replaced" };

function serialize(message: ServerMessage): string {
  return JSON.stringify(message);
}

export default class PokerServer implements Party.Server {
  private phase: Phase = PHASES.waiting;
  private hostId = "";
  private topic = "";
  private players: Map<string, Player> = new Map();
  private votes: Map<string, string> = new Map();
  private confidences: Map<string, string> = new Map();
  private explanations: Map<string, string> = new Map();
  private config: RoomConfig = {
    cards: ["1", "2", "3", "5", "8", "13", "20", "40", "100", "infinity", "?", "coffee", "brownie", "yak"],
    autoReveal: false,
  };
  private topics: string[] = [];
  private currentTopicIndex = 0;
  private topicResults: Map<number, TopicResult> = new Map();
  private pendingDisconnects: Map<string, { name: string; timer: ReturnType<typeof setTimeout> }> = new Map();

  constructor(readonly room: Party.Room) {}

  private getColorForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    const index = Math.abs(hash) % PLAYER_COLORS.length;
    return PLAYER_COLORS[index];
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

    const confidences: Record<string, string> = {};
    for (const [playerId, value] of this.confidences.entries()) {
      confidences[playerId] = value;
    }

    const votedPlayerIds: string[] = [];
    for (const [playerId, player] of this.players.entries()) {
      if (player.hasVoted) {
        votedPlayerIds.push(playerId);
      }
    }

    const isRevealed = this.phase === "revealed";

    const explanations: Record<string, string> = {};
    if (isRevealed) {
      for (const [playerId, text] of this.explanations.entries()) {
        explanations[playerId] = text;
      }
    }

    const topicResults: Record<number, TopicResult> = {};
    for (const [index, result] of this.topicResults.entries()) {
      topicResults[index] = result;
    }

    const topic = this.topics.length > 0 && this.currentTopicIndex < this.topics.length
      ? this.topics[this.currentTopicIndex]
      : this.topic;

    return {
      phase: this.phase,
      hostId: this.hostId,
      topic,
      players,
      votes: isRevealed ? votes : {},
      confidences: isRevealed ? confidences : {},
      votedPlayerIds,
      config: this.config,
      explanations,
      topics: this.topics,
      currentTopicIndex: this.currentTopicIndex,
      topicResults,
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

    const confidences: Record<string, string> = {};
    for (const [playerId, value] of this.confidences.entries()) {
      confidences[playerId] = value;
    }

    this.room.broadcast(serialize({ type: "revealed", votes, confidences }));
  }

  private deduplicateName(name: string): string {
    const existingNames = new Set(
      [...this.players.values()].map((p) => p.name)
    );
    if (!existingNames.has(name)) return name;
    let suffix = 2;
    while (existingNames.has(`${name} (${suffix})`)) {
      suffix++;
    }
    return `${name} (${suffix})`;
  }

  private handleJoin(sender: Party.Connection, msg: JoinMessage): void {
    // Check if same name already exists — replace the old connection
    let existingId: string | null = null;
    let existingPlayer: Player | null = null;
    for (const [id, p] of this.players.entries()) {
      if (p.name === msg.name && id !== sender.id) {
        existingId = id;
        existingPlayer = p;
        break;
      }
    }

    if (existingId && existingPlayer) {
      // Take over the existing player's spot
      const wasHost = this.hostId === existingId;

      // Tell old connection it's been replaced, then close it
      for (const conn of this.room.getConnections()) {
        if (conn.id === existingId) {
          conn.send(serialize({ type: "replaced" }));
          conn.close();
          break;
        }
      }

      // Remove old entry, preserve vote state
      const existingVote = this.votes.get(existingId);
      const existingConfidence = this.confidences.get(existingId);
      this.players.delete(existingId);
      this.votes.delete(existingId);
      this.confidences.delete(existingId);
      this.explanations.delete(existingId);

      // Create new entry with same name/color, new ID
      const player: Player = {
        id: sender.id,
        name: existingPlayer.name,
        color: existingPlayer.color,
        hasVoted: existingPlayer.hasVoted,
      };
      this.players.set(sender.id, player);

      // Restore vote if they had one
      if (existingVote) this.votes.set(sender.id, existingVote);
      if (existingConfidence) this.confidences.set(sender.id, existingConfidence);

      // Transfer host if needed
      if (wasHost) this.hostId = sender.id;

      // Send full state and broadcast sync (simpler than player-left + player-joined)
      this.broadcastSync();
      return;
    }

    // Check if this is a reconnecting player (pending disconnect with same name)
    for (const [oldId, pending] of this.pendingDisconnects.entries()) {
      if (pending.name === msg.name) {
        clearTimeout(pending.timer);
        this.pendingDisconnects.delete(oldId);

        // Take over the old player's spot silently
        const oldPlayer = this.players.get(oldId);
        if (oldPlayer) {
          const wasHost = this.hostId === oldId;
          const existingVote = this.votes.get(oldId);
          const existingConfidence = this.confidences.get(oldId);

          this.players.delete(oldId);
          this.votes.delete(oldId);
          this.confidences.delete(oldId);
          this.explanations.delete(oldId);

          const player: Player = {
            id: sender.id,
            name: oldPlayer.name,
            color: oldPlayer.color,
            hasVoted: oldPlayer.hasVoted,
          };
          this.players.set(sender.id, player);

          if (existingVote) this.votes.set(sender.id, existingVote);
          if (existingConfidence) this.confidences.set(sender.id, existingConfidence);
          if (wasHost) this.hostId = sender.id;

          // Silent rejoin — no player-left or player-joined, just sync
          this.broadcastSync();
          return;
        }
      }
    }

    // New player
    const uniqueName = this.deduplicateName(msg.name);
    const player: Player = {
      id: sender.id,
      name: uniqueName,
      color: this.getColorForName(uniqueName),
      hasVoted: false,
    };

    this.players.set(sender.id, player);

    // First player becomes host (only if no host assigned yet)
    if (this.players.size === 1 && (this.hostId === "" || !this.players.has(this.hostId))) {
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
    this.confidences.set(sender.id, msg.confidence ?? "confident");
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

    // If topics exist and not at the end, auto-advance to next topic
    if (this.topics.length > 0 && this.currentTopicIndex < this.topics.length - 1) {
      this.handleNextTopic(sender);
      return;
    }

    this.votes.clear();
    this.confidences.clear();
    this.explanations.clear();
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

  private handleExplain(sender: Party.Connection, msg: ExplainMessage): void {
    if (this.phase !== PHASES.revealed) {
      this.sendError(sender, "Can only explain after reveal");
      return;
    }

    const player = this.players.get(sender.id);
    if (!player) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    this.explanations.set(sender.id, msg.text);

    this.room.broadcast(
      serialize({ type: "explanation", playerId: sender.id, text: msg.text })
    );
  }

  private computeVoteAverage(): number | null {
    const numericVotes: number[] = [];
    for (const value of this.votes.values()) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && isFinite(parsed)) {
        numericVotes.push(parsed);
      }
    }
    if (numericVotes.length === 0) return null;
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return Math.round((sum / numericVotes.length) * 100) / 100;
  }

  private saveCurrentTopicResult(): void {
    if (this.topics.length === 0) return;
    const currentTopic = this.topics[this.currentTopicIndex] ?? "";
    const votes: Record<string, string> = {};
    for (const [playerId, value] of this.votes.entries()) {
      votes[playerId] = value;
    }
    this.topicResults.set(this.currentTopicIndex, {
      topic: currentTopic,
      votes,
      average: this.computeVoteAverage(),
    });
  }

  private clearRoundState(): void {
    this.votes.clear();
    this.confidences.clear();
    this.explanations.clear();
    for (const player of this.players.values()) {
      player.hasVoted = false;
    }
    this.phase = PHASES.voting;
  }

  private broadcastTopicsUpdated(): void {
    this.room.broadcast(
      serialize({
        type: "topics-updated",
        topics: this.topics,
        currentTopicIndex: this.currentTopicIndex,
      })
    );
  }

  private handleSetTopics(sender: Party.Connection, msg: SetTopicsMessage): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can set topics");
      return;
    }

    this.topics = msg.topics;
    this.currentTopicIndex = 0;
    if (this.topics.length > 0) {
      this.topic = this.topics[0];
    }
    this.broadcastSync();
  }

  private handleNextTopic(sender: Party.Connection): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can advance topics");
      return;
    }

    if (this.topics.length === 0) {
      this.sendError(sender, "No topics have been set");
      return;
    }

    this.saveCurrentTopicResult();
    this.currentTopicIndex++;

    if (this.currentTopicIndex >= this.topics.length) {
      this.currentTopicIndex = this.topics.length - 1;
      this.sendError(sender, "Already at the last topic");
      return;
    }

    this.topic = this.topics[this.currentTopicIndex];
    this.clearRoundState();

    this.room.broadcast(
      serialize({ type: "new-round", topic: this.topic })
    );
    this.broadcastTopicsUpdated();
  }

  private handlePrevTopic(sender: Party.Connection): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can navigate topics");
      return;
    }

    if (this.topics.length === 0) {
      this.sendError(sender, "No topics have been set");
      return;
    }

    if (this.currentTopicIndex <= 0) {
      this.sendError(sender, "Already at the first topic");
      return;
    }

    this.currentTopicIndex--;
    this.topic = this.topics[this.currentTopicIndex];
    this.clearRoundState();

    this.room.broadcast(
      serialize({ type: "new-round", topic: this.topic })
    );
    this.broadcastTopicsUpdated();
  }

  private handleKick(sender: Party.Connection, msg: KickMessage): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can kick players");
      return;
    }

    if (msg.playerId === sender.id) {
      this.sendError(sender, "You cannot kick yourself");
      return;
    }

    const player = this.players.get(msg.playerId);
    if (!player) {
      this.sendError(sender, "Player not found");
      return;
    }

    this.players.delete(msg.playerId);
    this.votes.delete(msg.playerId);
    this.confidences.delete(msg.playerId);
    this.explanations.delete(msg.playerId);

    // Send kicked message to the kicked player and close their connection
    for (const conn of this.room.getConnections()) {
      if (conn.id === msg.playerId) {
        conn.send(serialize({ type: "kicked" }));
        conn.close();
        break;
      }
    }

    // Broadcast player-left to remaining players
    this.room.broadcast(
      serialize({ type: "player-left", playerId: msg.playerId })
    );

    // Check if removing the player triggers auto-reveal
    this.checkAutoReveal();
  }

  private handleTransferHost(sender: Party.Connection, msg: { playerId: string }): void {
    if (!this.isHost(sender.id)) {
      this.sendError(sender, "Only the host can transfer host");
      return;
    }

    if (!this.players.has(msg.playerId)) {
      this.sendError(sender, "Player not found");
      return;
    }

    this.hostId = msg.playerId;
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
      case "explain":
        this.handleExplain(sender, parsed);
        break;
      case "set-topics":
        this.handleSetTopics(sender, parsed);
        break;
      case "next-topic":
        this.handleNextTopic(sender);
        break;
      case "prev-topic":
        this.handlePrevTopic(sender);
        break;
      case "kick":
        this.handleKick(sender, parsed);
        break;
      case "transfer-host":
        this.handleTransferHost(sender, parsed);
        break;
      default:
        this.sendError(sender, "Unknown message type");
    }
  }

  onClose(conn: Party.Connection): void {
    const player = this.players.get(conn.id);
    if (!player) return;

    const playerName = player.name;
    const wasHost = this.isHost(conn.id);

    // Grace period: don't broadcast player-left immediately.
    // If same name rejoins within 3s, it's a tab switch / reconnect.
    const timer = setTimeout(() => {
      this.pendingDisconnects.delete(conn.id);

      // Check if they already rejoined under a new connection ID
      const rejoinedAsOther = [...this.players.values()].some(
        (p) => p.name === playerName && p.id !== conn.id
      );
      if (rejoinedAsOther) return;

      // Actually remove
      this.players.delete(conn.id);
      this.votes.delete(conn.id);
      this.confidences.delete(conn.id);
      this.explanations.delete(conn.id);

      this.room.broadcast(
        serialize({ type: "player-left", playerId: conn.id })
      );

      if (wasHost) {
        this.promoteNextHost();
        if (this.hostId !== "") {
          this.broadcastSync();
        }
      }
    }, 3000);

    this.pendingDisconnects.set(conn.id, { name: playerName, timer });
  }
}
