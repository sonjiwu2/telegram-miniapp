// Провайдер-агностичный интерфейс (раздел 0 ТЗ): бизнес-логика не привязана
// к конкретному AI-провайдеру, только к этой форме.
export interface Verdict {
  // true — Решала отказался выносить решение (раздел 12: чувствительная тема).
  // Остальные поля в этом случае пустые, фиксированный текст добавляет наш код,
  // а не модель — это надёжнее, чем доверять формулировку модели.
  refused: boolean;
  headline: string;
  verdict: string;
  reasoning: string;
  sentence: string;
}

export interface GenerateVerdictInput {
  situation: string;
  tone: string;
}

// Сторона спора для AI-судьи — id здесь НЕ настоящий cuid из БД, а буква
// (A, B, ...), которую резолвер сессии присваивает опциям по порядку и потом
// сам сопоставляет обратно. Модели никогда не передаётся реальный internal id.
export interface DebateSide {
  id: string;
  name: string;
  argument: string;
}

export interface JudgeDebateInput {
  question: string;
  sides: DebateSide[];
  tone: string;
}

// Раздел 10 ТЗ: строго структурированный ответ, никакого свободного текста.
export interface DebateVerdict {
  refused: boolean;
  winnerId: string;
  headline: string;
  reasoning: string;
  sentence: string;
  confidence: number;
}

export interface AIProvider {
  generateVerdict(input: GenerateVerdictInput): Promise<Verdict>;
  judgeDebate(input: JudgeDebateInput): Promise<DebateVerdict>;
}
