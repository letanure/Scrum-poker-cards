import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getCardInfo, CARD_BACK_SVG } from "../lib/cards.ts";

const CARD_SIZES = {
  sm: { width: 48, height: 68, fontSize: "text-xs", valueSize: "text-sm" },
  md: { width: 88, height: 124, fontSize: "text-base", valueSize: "text-xl" },
  lg: { width: 110, height: 154, fontSize: "text-xl", valueSize: "text-3xl" },
} as const;

type CardSize = keyof typeof CARD_SIZES;

interface CardProps {
  value: string;
  isFlipped: boolean;
  isSelected: boolean;
  onClick?: () => void;
  size?: CardSize;
  widthOverride?: number;
  heightOverride?: number;
}

export function Card({
  value,
  isFlipped,
  isSelected,
  onClick,
  size = "md",
  widthOverride,
  heightOverride,
}: CardProps) {
  const { t } = useTranslation();
  const baseDimensions = CARD_SIZES[size];
  const dimensions = {
    ...baseDimensions,
    width: widthOverride ?? baseDimensions.width,
    height: heightOverride ?? baseDimensions.height,
  };
  const cardInfo = getCardInfo(value);
  const label = cardInfo?.label ?? value;
  const svgPath = cardInfo?.svgPath;
  const cardColor = cardInfo?.color ?? "#BA3033";

  const descKey = `cards.${value}.description`;
  const translatedDescription = cardInfo ? t(descKey) : value;

  return (
    <motion.div
      id={`card--${value}`}
      className="card cursor-pointer select-none"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        perspective: 800,
      }}
      animate={{
        y: isSelected ? -8 : 0,
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Face-up side */}
        <div
          className={`absolute inset-0 rounded-xl overflow-hidden flex flex-col items-center justify-center ${
            isSelected
              ? "ring-3 ring-[#BA3033] shadow-lg shadow-[#BA3033]/30"
              : "shadow-md"
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {svgPath ? (
            /* Card with SVG illustration */
            <img
              src={svgPath}
              alt={translatedDescription}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            /* Fallback for cards without illustrations (t-shirt sizes, etc.) */
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-1"
              style={{ backgroundColor: `${cardColor}20`, border: `2px solid ${cardColor}` }}
            >
              <span
                className={`font-extrabold ${dimensions.valueSize} leading-none`}
                style={{ color: cardColor }}
              >
                {label}
              </span>
            </div>
          )}
        </div>

        {/* Face-down (back) side */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-md"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <img
            src={CARD_BACK_SVG}
            alt="Card back"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
