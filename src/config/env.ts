import "server-only";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Telegram auth (Этап 2).
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET должен быть не короче 32 символов"),
    ALLOW_DEV_AUTH: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DEV_TELEGRAM_USER_ID: z.string().optional(),

    // Появятся начиная с Этапа 11 (AI verdict).
    AI_PROVIDER: z.string().optional(),
    AI_API_KEY: z.string().optional(),
  })
  .refine((data) => !(data.NODE_ENV === "production" && data.ALLOW_DEV_AUTH), {
    message: "ALLOW_DEV_AUTH must not be true when NODE_ENV=production",
    path: ["ALLOW_DEV_AUTH"],
  })
  .refine((data) => !(data.ALLOW_DEV_AUTH && !data.DEV_TELEGRAM_USER_ID), {
    message: "DEV_TELEGRAM_USER_ID is required when ALLOW_DEV_AUTH=true",
    path: ["DEV_TELEGRAM_USER_ID"],
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}

export const env = parseEnv();
