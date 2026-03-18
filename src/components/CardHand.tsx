import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "./Card.tsx";
import { getCardInfo } from "../lib/cards.ts";

const CARD_ASPECT = 1.4;
const MIN_CARD_WIDTH = 56;
const MAX_CARD_WIDTH = 88;
const CARD_GAP = 6;
const HAND_PADDING = 16;

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
  const { t } = useTranslation();
  const totalCards = cards.length;
  const midIndex = (totalCards - 1) / 2;
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const cardWidth = useMemo(() => {
    if (typeof window === "undefined") return MAX_CARD_WIDTH;
    const availableWidth = window.innerWidth - HAND_PADDING * 2;
    const fitWidth = Math.floor((availableWidth - CARD_GAP * (totalCards - 1)) / totalCards);
    return Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, fitWidth));
  }, [totalCards]);

  const cardHeight = Math.round(cardWidth * CARD_ASPECT);

  const confirmSelection = useCallback((value: string) => {
    const info = getCardInfo(value);
    if (info && onCardDescription) {
      const descKey = `cards.${value}.description`;
      const expKey = `cards.${value}.explanation`;
      const description = t(descKey);
      const explanation = info.explanation ? t(expKey) : undefined;
      onCardDescription(description, explanation);
    }
    onSelect(value);
  }, [onSelect, onCardDescription, t]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (prev === null) {
            const selectedIdx = selectedCard ? cards.indexOf(selectedCard) : -1;
            return selectedIdx >= 0 ? (selectedIdx < cards.length - 1 ? selectedIdx + 1 : 0) : 0;
          }
          return prev < cards.length - 1 ? prev + 1 : 0;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (prev === null) {
            const selectedIdx = selectedCard ? cards.indexOf(selectedCard) : -1;
            return selectedIdx >= 0 ? (selectedIdx > 0 ? selectedIdx - 1 : cards.length - 1) : cards.length - 1;
          }
          return prev > 0 ? prev - 1 : cards.length - 1;
        });
      } else if (e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        const idx = highlightedIndex ?? (selectedCard ? cards.indexOf(selectedCard) : null);
        if (idx !== null && idx >= 0 && idx < cards.length) {
          confirmSelection(cards[idx]);
          setHighlightedIndex(null);
        }
      } else if (e.key === "ArrowDown" || e.key === "Escape") {
        e.preventDefault();
        setHighlightedIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards, selectedCard, highlightedIndex, disabled, confirmSelection]);

  const needsScroll = totalCards * (MIN_CARD_WIDTH + CARD_GAP) > (typeof window !== "undefined" ? window.innerWidth - HAND_PADDING * 2 : 9999);

  return (
    <motion.div
      id="card-hand"
      className={`flex items-end px-4 pt-8 pb-4 ${needsScroll ? "justify-start overflow-x-auto" : "justify-center"} ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      style={{ overflowY: "visible", gap: `${Math.min(CARD_GAP, cardWidth > 60 ? 8 : 2)}px`, WebkitOverflowScrolling: "touch" }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
    >
      {cards.map((value, index) => {
        const offset = index - midIndex;
        const rotation = offset * (cardWidth > 60 ? 2 : 1.5);
        const isSelected = selectedCard === value;
        const isHighlighted = highlightedIndex === index;

        return (
          <motion.div
            key={value}
            id={`card-hand__card--${value}`}
            className="card-hand__card"
            style={{
              rotate: `${rotation}deg`,
              zIndex: isHighlighted ? 51 : isSelected ? 50 : totalCards - Math.abs(Math.round(offset)),
              position: "relative",
            }}
            animate={{
              y: isHighlighted ? -14 : isSelected ? -20 : 0,
              scale: isHighlighted ? 1.1 : isSelected ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {isHighlighted && !isSelected && (
              <div
                className="absolute -inset-1 rounded-xl border-2 border-dashed border-[#7F6CB1] pointer-events-none"
                style={{ zIndex: 52 }}
              />
            )}
            <Card
              value={value}
              isFlipped={false}
              isSelected={isSelected}
              onClick={() => {
                setHighlightedIndex(null);
                confirmSelection(value);
              }}
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
