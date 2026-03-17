export type CardInfo = {
  label: string;
  description: string;
  svgPath: string;
  color: string;
};

export const CARD_MAP: Record<string, CardInfo> = {
  "1": {
    label: "1",
    description: "Low hanging fruit",
    svgPath: "/svg/planning poker_Low hanging fruit.svg",
    color: "#E8567F",
  },
  "2": {
    label: "2",
    description: "Piece of cake",
    svgPath: "/svg/planning poker_Piece of cake.svg",
    color: "#D94873",
  },
  "3": {
    label: "3",
    description: "It ain't rocket science",
    svgPath: "/svg/planning poker_It ain't rocket science.svg",
    color: "#C73A6B",
  },
  "5": {
    label: "5",
    description: "Ornitorinco",
    svgPath: "/svg/planning poker-Ornitorinco.svg",
    color: "#B52D63",
  },
  "8": {
    label: "8",
    description: "An arm and a leg",
    svgPath: "/svg/planning poker_An arm and a leg.svg",
    color: "#A3205B",
  },
  "13": {
    label: "13",
    description: "Squeaking by",
    svgPath: "/svg/planning poker_Squeaking by.svg",
    color: "#8E1A5A",
  },
  "20": {
    label: "20",
    description: "Don't put all your eggs in one basket",
    svgPath: "/svg/planning poker_Don't put all .svg",
    color: "#7A1458",
  },
  "40": {
    label: "40",
    description: "Meterse en un berenjenal",
    svgPath: "/svg/planning poker_Meterse en un berenjenal.svg",
    color: "#661055",
  },
  "100": {
    label: "100",
    description: "Monster task",
    svgPath: "/svg/planning poker_Monster task.svg",
    color: "#520D52",
  },
  infinity: {
    label: "\u221E",
    description: "When pigs fly",
    svgPath: "/svg/planning poker_When pigs fly.svg",
    color: "#3D0A4F",
  },
  "?": {
    label: "?",
    description: "Here be dragons",
    svgPath: "/svg/planning poker_Here be dragons.svg",
    color: "#6B3FA0",
  },
  coffee: {
    label: "\u2615",
    description: "Coffee break",
    svgPath: "/svg/planning poker_Coffee break.svg",
    color: "#8B5E3C",
  },
  brownie: {
    label: "\uD83C\uDF6B",
    description: "Eat a brownie",
    svgPath: "/svg/planning poker_Eat a brownie.svg",
    color: "#5C3317",
  },
  yak: {
    label: "\uD83D\uDC02",
    description: "Yak Shaving",
    svgPath: "/svg/planning poker_Yak Shaving.svg",
    color: "#4A6741",
  },
} as const;

export const CARD_BACK_SVG = "/svg/Cover option 2.svg";

export const PRESETS = {
  fibonacci: ["1", "2", "3", "5", "8", "13", "20", "40", "100", "infinity", "?", "coffee"],
  tshirt: ["1", "2", "3", "5", "8", "13", "?", "coffee"],
  powers: ["1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "coffee"],
  redbooth: ["1", "2", "3", "5", "8", "13", "20", "40", "100", "infinity", "?", "coffee", "brownie", "yak"],
} as const;

export type PresetName = keyof typeof PRESETS;

export const getCardInfo = (value: string): CardInfo | undefined => {
  return CARD_MAP[value];
};

const ADJECTIVES = [
  "funny",
  "swift",
  "brave",
  "clever",
  "jolly",
  "mighty",
  "gentle",
  "fierce",
  "happy",
  "bold",
  "calm",
  "dizzy",
  "eager",
  "fancy",
  "giddy",
  "humble",
  "keen",
  "lively",
  "merry",
  "noble",
] as const;

const NOUNS = [
  "unicorn",
  "dragon",
  "phoenix",
  "kraken",
  "falcon",
  "panda",
  "otter",
  "tiger",
  "koala",
  "eagle",
  "dolphin",
  "parrot",
  "fox",
  "wolf",
  "badger",
  "raven",
  "lynx",
  "owl",
  "bear",
  "hawk",
] as const;

export const generateRoomId = (): string => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
};
