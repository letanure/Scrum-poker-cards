import { useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "./Card.tsx";
import { getCardInfo } from "../lib/cards.ts";

const CARD_ASPECT = 1.4;
const MIN_CARD_WIDTH = 48;
const MAX_CARD_WIDTH = 88;
const CARD_GAP = 6;
const HAND_PADDING = 32;

interface CardHandProps {
  cards: string[];
  selectedCard: string | null;
  onSelect: (value: string) => void;
  onCardDescription?: (description: string, explanation?: string) => void;
  disabled: boolean;
}

export function CardHand({
  cards,
  selectedCard,
  onSelect,
  onCardDescription,
  disabled,
}: CardHandProps) {
  const totalCards = cards.length;
  const midIndex = (totalCards - 1) / 2;

  const cardWidth = useMemo(() => {
    if (typeof window === "undefined") return MAX_CARD_WIDTH;
    const availableWidth = window.innerWidth - HAND_PADDING * 2;
    const fitWidth = Math.floor((availableWidth - CARD_GAP * (totalCards - 1)) / totalCards);
    return Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, fitWidth));
  }, [totalCards]);

  const cardHeight = Math.round(cardWidth * CARD_ASPECT);

  const handleSelect = useCallback((value: string) => {
    const info = getCardInfo(value);
    if (info?.description && onCardDescription) {
      onCardDescription(info.description, info.explanation);
    }
    onSelect(value);
  }, [onSelect, onCardDescription]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Enter") return;

      const currentIndex = selectedCard ? cards.indexOf(selectedCard) : -1;

      if (e.key === "ArrowRight") {
        const next = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        handleSelect(cards[next]);
      } else if (e.key === "ArrowLeft") {
        const prev = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        handleSelect(cards[prev]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards, selectedCard, disabled, handleSelect]);

  return (
    <motion.div
      id="card-hand"
      className={`flex items-end justify-center px-4 pt-8 pb-4 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      style={{ overflow: "visible", gap: `${Math.min(CARD_GAP, cardWidth > 60 ? 8 : 2)}px` }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
    >
      {cards.map((value, index) => {
        const offset = index - midIndex;
        const rotation = offset * (cardWidth > 60 ? 2 : 1.5);
        const isSelected = selectedCard === value;

        return (
          <motion.div
            key={value}
            id={`card-hand__card--${value}`}
            className="card-hand__card"
            style={{
              rotate: `${rotation}deg`,
              zIndex: isSelected ? 50 : totalCards - Math.abs(Math.round(offset)),
              position: "relative",
            }}
            animate={{
              y: isSelected ? -20 : 0,
              scale: isSelected ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Card
              value={value}
              isFlipped={false}
              isSelected={isSelected}
              onClick={() => handleSelect(value)}
              size="md"
              widthOverride={cardWidth}
              heightOverride={cardHeight}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
