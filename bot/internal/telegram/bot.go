package telegram

import "log"

// Bot wraps the Telegram Bot API client with RESHALA-specific behavior.
type Bot struct {
	api        *api
	username   string
	miniAppURL string
}

func New(token, miniAppURL string) (*Bot, error) {
	a := newAPI(token)

	me, err := a.getMe()
	if err != nil {
		return nil, err
	}

	return &Bot{api: a, username: me.Username, miniAppURL: miniAppURL}, nil
}

// Username returns the bot's own @username, useful for building deep links.
func (b *Bot) Username() string {
	return b.username
}

// Run starts long polling and blocks forever, logging (but not exiting on)
// transient Telegram API errors.
func (b *Bot) Run() {
	offset := 0

	for {
		updates, err := b.api.getUpdates(offset, 60)
		if err != nil {
			log.Printf("getUpdates: %v", err)
			continue
		}

		for _, update := range updates {
			offset = update.UpdateID + 1

			if update.Message == nil {
				continue
			}

			b.handleMessage(*update.Message)
		}
	}
}

func (b *Bot) handleMessage(message Message) {
	if message.IsCommand() && message.Command() == "start" {
		b.sendLaunchButton(message.Chat.ID)
		return
	}

	if err := b.api.sendMessage(message.Chat.ID, "Решала слушает. Набери /start.", nil); err != nil {
		log.Printf("send reply: %v", err)
	}
}

func (b *Bot) sendLaunchButton(chatID int64) {
	markup := &InlineKeyboardMarkup{
		InlineKeyboard: [][]InlineKeyboardButton{
			{
				{
					Text:   "🎲 Запустить RESHALA",
					WebApp: &WebAppInfo{URL: b.miniAppURL},
				},
			},
		},
	}

	if err := b.api.sendMessage(chatID, "Решала на связи. Жми, чтобы начать.", markup); err != nil {
		log.Printf("send launch button: %v", err)
	}
}
