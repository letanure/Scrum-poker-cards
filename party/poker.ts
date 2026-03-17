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
  stableId: string;
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
  | KickedMessage;

function serialize(message: ServerMessage): string {
  return JSON.stringify(message);
}

export default class PokerServer implements Party.Server {
  private phase: Phase = PHASES.waiting;
  private hostId = ""; // stableId of the host
  private topic = "";
  /** Players keyed by stableId */
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

  /** Maps stableId → current connectionId */
  private connectionMap: Map<string, string> = new Map();
  /** Pending disconnect timers keyed by stableId */
  private pendingDisconnects: Map<string, { timer: ReturnType<typeof setTimeout> }> = new Map();

  constructor(readonly room: Party.Room) {}

  private getColorForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    const index = Math.abs(hash) % PLAYER_COLORS.length;
    return PLAYER_COLORS[index];
  }

  /** Reverse lookup: find stableId for a given connectionId */
  private getStableIdByConnection(connId: string): string | null {
    for (const [stableId, cId] of this.connectionMap.entries()) {
      if (cId === connId) return stableId;
    }
    return null;
  }

  /** Find the active Party.Connection for a stableId */
  private getConnectionForPlayer(stableId: string): Party.Connection | null {
    const connId = this.connectionMap.get(stableId);
    if (!connId) return null;
    for (const conn of this.room.getConnections()) {
      if (conn.id === connId) return conn;
    }
    return null;
  }

  private serializeState(): SerializedRoomState {
    const players: Player[] = [];
    for (const player of this.players.values()) {
      players.push(player);
    }

    const votes: Record<string, string> = {};
    for (const [stableId, value] of this.votes.entries()) {
      votes[stableId] = value;
    }

    const confidences: Record<string, string> = {};
    for (const [stableId, value] of this.confidences.entries()) {
      confidences[stableId] = value;
    }

    const votedPlayerIds: string[] = [];
    for (const [stableId, player] of this.players.entries()) {
      if (player.hasVoted) {
        votedPlayerIds.push(stableId);
      }
    }

    const isRevealed = this.phase === "revealed";

    const explanations: Record<string, string> = {};
    if (isRevealed) {
      for (const [stableId, text] of this.explanations.entries()) {
        explanations[stableId] = text;
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

  private isHost(stableId: string): boolean {
    return this.hostId === stableId;
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
    for (const [stableId, value] of this.votes.entries()) {
      votes[stableId] = value;
    }

    const confidences: Record<string, string> = {};
    for (const [stableId, value] of this.confidences.entries()) {
      confidences[stableId] = value;
    }

    this.room.broadcast(serialize({ type: "revealed", votes, confidences }));
  }

  private deduplicateName(name: string, excludeStableId?: string): string {
    const existingNames = new Set(
      [...this.players.entries()]
        .filter(([id]) => id !== excludeStableId)
        .map(([, p]) => p.name)
    );
    if (!existingNames.has(name)) return name;
    let suffix = 2;
    while (existingNames.has(`${name} (${suffix})`)) {
      suffix++;
    }
    return `${name} (${suffix})`;
  }

  private handleJoin(sender: Party.Connection, msg: JoinMessage): void {
    const stableId = msg.stableId;
    const existingPlayer = this.players.get(stableId);

    if (existingPlayer) {
      // Reconnect: same stableId already exists
      const oldConnId = this.connectionMap.get(stableId);

      // Close old connection if still open (silently)
      if (oldConnId && oldConnId !== sender.id) {
        for (const conn of this.room.getConnections()) {
          if (conn.id === oldConnId) {
            conn.close();
            break;
          }
        }
      }

      // Update connection mapping
      this.connectionMap.set(stableId, sender.id);

      // Update player name if changed
      if (existingPlayer.name !== msg.name) {
        existingPlayer.name = msg.name;
      }

      // Cancel any pending disconnect timer
      const pending = this.pendingDisconnects.get(stableId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingDisconnects.delete(stableId);
      }

      // Broadcast sync to everyone (updates connection mapping, no player-left/joined)
      this.broadcastSync();
      return;
    }

    // New player
    const uniqueName = this.deduplicateName(msg.name);
    const player: Player = {
      id: stableId,
      name: uniqueName,
      color: this.getColorForName(uniqueName),
      hasVoted: false,
    };

    this.players.set(stableId, player);
    this.connectionMap.set(stableId, sender.id);

    // First player becomes host (only if no host assigned yet)
    if (this.players.size === 1 && (this.hostId === "" || !this.players.has(this.hostId))) {
      this.hostId = stableId;
      if (this.phase === PHASES.waiting) {
        this.phase = PHASES.voting;
      }
    }

    // Send full state to the joiner
    sender.send(serialize({ type: "sync", state: this.serializeState() }));

    // Broadcast player-joined to others
    const senderConnId = sender.id;
    this.room.broadcast(
      serialize({ type: "player-joined", player }),
      [senderConnId]
    );
  }

  private handleVote(sender: Party.Connection, msg: VoteMessage): void {
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    if (this.phase !== PHASES.voting) {
      this.sendError(sender, "Voting is not active");
      return;
    }

    const player = this.players.get(stableId);
    if (!player) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    this.votes.set(stableId, msg.value);
    this.confidences.set(stableId, msg.confidence ?? "confident");
    player.hasVoted = true;

    this.room.broadcast(
      serialize({ type: "player-voted", playerId: stableId })
    );

    this.checkAutoReveal();
  }

  private handleReveal(sender: Party.Connection): void {
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
      this.sendError(sender, "Only the host can set the topic");
      return;
    }

    this.topic = msg.topic;
    this.broadcastSync();
  }

  private handleExplain(sender: Party.Connection, msg: ExplainMessage): void {
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    if (this.phase !== PHASES.revealed) {
      this.sendError(sender, "Can only explain after reveal");
      return;
    }

    const player = this.players.get(stableId);
    if (!player) {
      this.sendError(sender, "You have not joined the room");
      return;
    }

    this.explanations.set(stableId, msg.text);

    this.room.broadcast(
      serialize({ type: "explanation", playerId: stableId, text: msg.text })
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
    for (const [stableId, value] of this.votes.entries()) {
      votes[stableId] = value;
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const senderStableId = this.getStableIdByConnection(sender.id);
    if (!senderStableId || !this.isHost(senderStableId)) {
      this.sendError(sender, "Only the host can kick players");
      return;
    }

    const targetStableId = msg.playerId;

    if (targetStableId === senderStableId) {
      this.sendError(sender, "You cannot kick yourself");
      return;
    }

    const player = this.players.get(targetStableId);
    if (!player) {
      this.sendError(sender, "Player not found");
      return;
    }

    this.players.delete(targetStableId);
    this.votes.delete(targetStableId);
    this.confidences.delete(targetStableId);
    this.explanations.delete(targetStableId);

    // Send kicked message to the kicked player and close their connection
    const targetConn = this.getConnectionForPlayer(targetStableId);
    if (targetConn) {
      targetConn.send(serialize({ type: "kicked" }));
      targetConn.close();
    }
    this.connectionMap.delete(targetStableId);

    // Cancel any pending disconnect
    const pending = this.pendingDisconnects.get(targetStableId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingDisconnects.delete(targetStableId);
    }

    // Broadcast player-left to remaining players
    this.room.broadcast(
      serialize({ type: "player-left", playerId: targetStableId })
    );

    // Check if removing the player triggers auto-reveal
    this.checkAutoReveal();
  }

  private handleTransferHost(sender: Party.Connection, msg: { playerId: string }): void {
    const senderStableId = this.getStableIdByConnection(sender.id);
    if (!senderStableId || !this.isHost(senderStableId)) {
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
    const stableId = this.getStableIdByConnection(sender.id);
    if (!stableId || !this.isHost(stableId)) {
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
    const stableId = this.getStableIdByConnection(conn.id);
    if (!stableId) return;

    // If the connectionMap already points to a different connection (already replaced), do nothing
    const currentConnId = this.connectionMap.get(stableId);
    if (currentConnId !== conn.id) return;

    const wasHost = this.isHost(stableId);

    // Grace period: 5s before actually removing the player
    const timer = setTimeout(() => {
      this.pendingDisconnects.delete(stableId);

      // Double-check: if they reconnected in the meantime, do nothing
      const nowConnId = this.connectionMap.get(stableId);
      if (nowConnId !== conn.id) return;

      // Actually remove
      this.players.delete(stableId);
      this.votes.delete(stableId);
      this.confidences.delete(stableId);
      this.explanations.delete(stableId);
      this.connectionMap.delete(stableId);

      this.room.broadcast(
        serialize({ type: "player-left", playerId: stableId })
      );

      if (wasHost) {
        this.promoteNextHost();
        if (this.hostId !== "") {
          this.broadcastSync();
        }
      }
    }, 5000);

    this.pendingDisconnects.set(stableId, { timer });
  }
}
