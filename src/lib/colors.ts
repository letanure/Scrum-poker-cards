export const PLAYER_COLORS = [
  "#FF6B6B", // coral red
  "#4ECDC4", // teal
  "#FFE66D", // sunny yellow
  "#A855F7", // purple
  "#F97316", // orange
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#22C55E", // green
  "#3B82F6", // blue
  "#EF4444", // red
  "#8B5CF6", // violet
  "#14B8A6", // emerald
] as const;

export const getPlayerColor = (index: number): string => {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
};
