import { motion } from "framer-motion";
import { Card } from "./Card.tsx";

interface CardHandProps {
  cards: string[];
  selectedCard: string | null;
  onSelect: (value: string) => void;
  disabled: boolean;
}

export function CardHand({
  cards,
  selectedCard,
  onSelect,
  disabled,
}: CardHandProps) {
  const totalCards = cards.length;
  const midIndex = (totalCards - 1) / 2;

  return (
    <motion.div
      className={`flex items-end justify-center gap-1 sm:gap-2 px-4 py-4 overflow-x-auto ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
    >
      {cards.map((value, index) => {
        const offset = index - midIndex;
        const rotation = offset * 2;
        const isSelected = selectedCard === value;

        return (
          <motion.div
            key={value}
            style={{ rotate: `${rotation}deg` }}
            animate={{
              y: isSelected ? -12 : 0,
              scale: isSelected ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Card
              value={value}
              isFlipped={false}
              isSelected={isSelected}
              onClick={() => onSelect(value)}
              size="md"
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
