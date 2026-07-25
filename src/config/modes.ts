import { Dices, Gavel, Sparkles, Swords, Users, Vote, type LucideIcon } from "lucide-react";

export interface ModeConfig {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stage: number;
}

export const MODES: ModeConfig[] = [
  {
    slug: "who-today",
    title: "Кто сегодня?",
    description: "Рулетка на участников",
    icon: Dices,
    stage: 5,
  },
  {
    slug: "random-pick",
    title: "Нам похуй",
    description: "Случайный выбор варианта",
    icon: Sparkles,
    stage: 6,
  },
  {
    slug: "debate",
    title: "Спор",
    description: "Голосование или AI-судья",
    icon: Swords,
    stage: 12,
  },
  {
    slug: "poll",
    title: "Голосование",
    description: "Обычный опрос",
    icon: Vote,
    stage: 9,
  },
  {
    slug: "ai-verdict",
    title: "AI Вердикт",
    description: "Абсурдно-серьёзное решение",
    icon: Gavel,
    stage: 11,
  },
  {
    slug: "company",
    title: "Компания",
    description: "Ваша постоянная тусовка",
    icon: Users,
    stage: 8,
  },
];
