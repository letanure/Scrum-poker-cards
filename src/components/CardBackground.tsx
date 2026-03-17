import { useState, useEffect, useMemo, useCallback } from "react";
import { CARD_MAP } from "../lib/cards.ts";
import { Card } from "./Card.tsx";

const CARD_KEYS = Object.keys(CARD_MAP);

const MIN_FLIP_INTERVAL = 6000;
const MAX_FLIP_INTERVAL = 15000;
const MIN_ROTATION = -25;
const MAX_ROTATION = 25;
const MIN_OPACITY = 0.15;
const MAX_OPACITY = 0.35;

interface CardPlacement {
  key: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  flipInterval: number;
  initialDelay: number;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const CARD_W = 12;
const CARD_H = 16;

function overlaps(
  x: number,
  y: number,
  placed: ReadonlyArray<{ x: number; y: number }>,
): boolean {
  return placed.some(
    (p) => Math.abs(p.x - x) < CARD_W && Math.abs(p.y - y) < CARD_H,
  );
}

function generatePlacements(): ReadonlyArray<CardPlacement> {
  const half = Math.ceil(CARD_KEYS.length / 2);
  const placed: Array<{ x: number; y: number }> = [];
  const shuffled = [...CARD_KEYS].sort(() => Math.random() - 0.5);

  return shuffled.map((key, index) => {
    const isLeft = index < half;

    let x: number;
    let y: number;
    let attempts = 0;
    let found = false;
    do {
      x = isLeft ? randomInRange(6, 26) : randomInRange(74, 94);
      y = randomInRange(8, 85);
      attempts++;
      if (!overlaps(x, y, placed)) {
        found = true;
        break;
      }
    } while (attempts < 80);

    if (!found) return null;

    placed.push({ x, y });

    return {
      key,
      x,
      y,
      rotation: randomInRange(MIN_ROTATION, MAX_ROTATION),
      opacity: randomInRange(MIN_OPACITY, MAX_OPACITY),
      flipInterval: randomInRange(MIN_FLIP_INTERVAL, MAX_FLIP_INTERVAL),
      initialDelay: randomInRange(1000, 10000),
    };
  }).filter((p): p is CardPlacement => p !== null);
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
        size="lg"
        widthOverride={100}
        heightOverride={140}
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
