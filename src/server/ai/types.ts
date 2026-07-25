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

export interface AIProvider {
  generateVerdict(input: GenerateVerdictInput): Promise<Verdict>;
}
