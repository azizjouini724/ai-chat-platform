import { Heart, ThumbsUp, Laugh, Zap, Frown, Angry, type LucideIcon } from "lucide-react";

export interface ReactionOption {
  key: string;
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

export const REACTION_OPTIONS: ReactionOption[] = [
  { key: "love", label: "J'adore", icon: Heart, colorClass: "text-rose-500" },
  { key: "like", label: "J'aime", icon: ThumbsUp, colorClass: "text-primary" },
  { key: "haha", label: "Haha", icon: Laugh, colorClass: "text-amber-500" },
  { key: "wow", label: "Wow", icon: Zap, colorClass: "text-violet-500" },
  { key: "sad", label: "Triste", icon: Frown, colorClass: "text-sky-500" },
  { key: "angry", label: "Grr", icon: Angry, colorClass: "text-orange-600" },
];

export function getReactionOption(key: string): ReactionOption | undefined {
  return REACTION_OPTIONS.find((r) => r.key === key);
}