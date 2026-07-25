// "server-only" бросает исключение вне рантайма Next.js (вне server-компонентов).
// Vitest выполняет модули в обычном Node-контексте, поэтому в тестах он заменяется
// на no-op через alias в vitest.config.ts.
export {};
