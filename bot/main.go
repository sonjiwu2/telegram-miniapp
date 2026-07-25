package main

import (
	"log"

	"reshala-bot/internal/config"
	"reshala-bot/internal/telegram"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	bot, err := telegram.New(cfg.BotToken, cfg.MiniAppURL)
	if err != nil {
		log.Fatalf("telegram: %v", err)
	}

	log.Printf("RESHALA bot @%s is running, Mini App URL: %s", bot.Username(), cfg.MiniAppURL)
	bot.Run()
}
