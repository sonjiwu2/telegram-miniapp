package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds the environment configuration for the bot service.
type Config struct {
	BotToken   string
	MiniAppURL string
}

// Load reads .env (if present) and validates the required environment
// variables. It intentionally fails fast: a bot without a token or a
// Mini App URL cannot do anything useful.
func Load() (Config, error) {
	_ = godotenv.Load()

	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	if token == "" {
		return Config{}, fmt.Errorf("TELEGRAM_BOT_TOKEN is required")
	}

	miniAppURL := os.Getenv("MINI_APP_URL")
	if miniAppURL == "" {
		return Config{}, fmt.Errorf("MINI_APP_URL is required")
	}

	return Config{BotToken: token, MiniAppURL: miniAppURL}, nil
}
