import { PlayerSlot } from "./PlayerSlot";

interface Player {
  id: string;
  name: string;
  color: string;
  hasVoted: boolean;
  isHost: boolean;
}

interface TableProps {
  players: Player[];
  currentUserId: string;
  revealedVotes: Record<string, string> | null;
  voteVersions: Record<string, number>;
}

export function Table({ players, currentUserId, revealedVotes, voteVersions }: TableProps) {
  const votedCount = players.filter((p) => p.hasVoted).length;
  const totalCount = players.length;
  const allVoted = votedCount === totalCount && totalCount > 0;

  return (
    <div id="table" className="flex flex-col items-center gap-8 py-8">
      {/* Player grid */}
      <div id="table__players" className="flex flex-wrap justify-center gap-6 max-w-2xl">
        {players.map((player) => (
          <PlayerSlot
            key={player.id}
            name={player.name}
            color={player.color}
            hasVoted={player.hasVoted}
            vote={revealedVotes?.[player.id] ?? null}
            isHost={player.isHost}
            isCurrentUser={player.id === currentUserId}
            voteVersion={voteVersions[player.id] ?? 0}
          />
        ))}
      </div>

      {/* Center status */}
      <div id="table__status" className="flex items-center justify-center px-6 py-3 rounded-2xl bg-white/80 shadow-md border border-[#F8ABAA]/40 backdrop-blur-sm">
        {revealedVotes ? (
          <span className="text-sm font-semibold text-[#BA3033]">
            Votes revealed!
          </span>
        ) : allVoted ? (
          <span className="text-sm font-semibold text-[#94A979]">
            All players voted - ready to reveal
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-[#7F6CB1]">{votedCount}</span>
            {" / "}
            <span className="font-semibold">{totalCount}</span>
            {" voted"}
          </span>
        )}
      </div>
    </div>
  );
}
