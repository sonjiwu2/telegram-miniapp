import "server-only";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Появятся начиная с Этапа 2 (Telegram auth).
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
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
