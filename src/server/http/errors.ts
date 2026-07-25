import { NextResponse } from "next/server";

// Единый формат ошибок API — см. раздел 35 продуктовой спецификации:
// { "error": { "code": "...", "message": "..." } }, без stack trace наружу.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: ApiError) {
  return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
}

// Оборачивает обработчик роута: ApiError превращается в единый JSON-формат
// ошибки, остальные исключения пробрасываются дальше (их ловит Next.js).
export async function withApiErrors(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    throw error;
  }
}
