import { useState, useEffect, useMemo, useCallback } from "react";
import { CARD_MAP } from "../lib/cards.ts";
import { Card } from "./Card.tsx";

const CARD_KEYS = Object.keys(CARD_MAP);

const MIN_FLIP_INTERVAL = 3000;
const MAX_FLIP_INTERVAL = 8000;
const MIN_ROTATION = -25;
const MAX_ROTATION = 25;
const MIN_OPACITY = 0.15;
const MAX_OPACITY = 0.3;

interface CardPlacement {
  key: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  flipInterval: number;
  initialDelay: number;
}

function generatePlacements(): ReadonlyArray<CardPlacement> {
  return CARD_KEYS.map((key) => ({
    key,
    x: Math.random() * 90 + 5,
    y: Math.random() * 85 + 5,
    rotation: MIN_ROTATION + Math.random() * (MAX_ROTATION - MIN_ROTATION),
    opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
    flipInterval:
      MIN_FLIP_INTERVAL + Math.random() * (MAX_FLIP_INTERVAL - MIN_FLIP_INTERVAL),
    initialDelay: Math.random() * 5000,
  }));
}

function BackgroundCard({ placement }: { placement: CardPlacement }) {
  const [isFlipped, setIsFlipped] = useState(() => Math.random() > 0.5);

  const toggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      toggle();
      const intervalId = setInterval(toggle, placement.flipInterval);
      cleanupRef = () => clearInterval(intervalId);
    }, placement.initialDelay);

    let cleanupRef: (() => void) | null = null;

    return () => {
      clearTimeout(timeoutId);
      cleanupRef?.();
    };
  }, [placement.flipInterval, placement.initialDelay, toggle]);

  const style = useMemo(
    () => ({
      left: `${placement.x}%`,
      top: `${placement.y}%`,
      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
      opacity: placement.opacity,
    }),
    [placement.x, placement.y, placement.rotation, placement.opacity],
  );

  return (
    <div className="absolute" style={style}>
      <Card
        value={placement.key}
        isFlipped={isFlipped}
        isSelected={false}
        size="md"
        widthOverride={70}
        heightOverride={98}
      />
    </div>
  );
}

export function CardBackground() {
  const placements = useMemo(() => generatePlacements(), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {placements.map((placement) => (
        <BackgroundCard key={placement.key} placement={placement} />
      ))}
    </div>
  );
}
