// Раздел 21 ТЗ. Реализованы только титулы, однозначно вычислимые по
// userId из текущей модели данных. "Народный любимец" (выиграл 5
// голосований) и "Вечно прав" (3 AI verdict победы подряд) требуют
// привязки стороны спора / варианта к конкретному аккаунту — сейчас
// сторона DEBATE это просто текст (Option.label), без userId, поэтому
// эти два титула сознательно не реализованы в этом этапе.
export interface AchievementCounts {
  rouletteWins: number;
  votesCast: number;
  debatesCreated: number;
  randomChoiceCreated: number;
  aiVerdictsCreated: number;
  pickedTwiceInARow: boolean;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  check: (counts: AchievementCounts) => boolean;
}

const DEFINITIONS: AchievementDefinition[] = [
  {
    code: "SYSTEM_VICTIM",
    title: "Жертва системы",
    description: "Выпал в рулетке 5 раз",
    check: (c) => c.rouletteWins >= 5,
  },
  {
    code: "UNLUCKY",
    title: "Невезучий",
    description: "Выпал два раза подряд",
    check: (c) => c.pickedTwiceInARow,
  },
  {
    code: "DEMOCRAT",
    title: "Демократ",
    description: "Проголосовал 50 раз",
    check: (c) => c.votesCast >= 50,
  },
  {
    code: "TROUBLEMAKER",
    title: "Создатель проблем",
    description: "Создал 20 споров",
    check: (c) => c.debatesCreated >= 20,
  },
  {
    code: "COULDNT_CARE_LESS",
    title: "Мне реально похуй",
    description: "Использовал «Нам похуй» 25 раз",
    check: (c) => c.randomChoiceCreated >= 25,
  },
  {
    code: "JUDGE_DREDD",
    title: "Судья Дредд",
    description: "Создал 10 AI Вердиктов",
    check: (c) => c.aiVerdictsCreated >= 10,
  },
];

export function evaluateAchievements(counts: AchievementCounts): Achievement[] {
  return DEFINITIONS.map(({ code, title, description, check }) => ({
    code,
    title,
    description,
    unlocked: check(counts),
  }));
}
