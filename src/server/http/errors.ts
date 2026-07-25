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
