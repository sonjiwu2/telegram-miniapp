// Package telegram — минимальный клиент официального Telegram Bot API
// (https://core.telegram.org/bots/api), реализующий только методы, нужные
// боту RESHALA: getMe, getUpdates, sendMessage с inline-кнопкой WebApp.
// Методы и JSON-схема соответствуют официальной документации 1:1.
package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const apiBaseURL = "https://api.telegram.org/bot"

type api struct {
	token      string
	httpClient *http.Client
}

func newAPI(token string) *api {
	return &api{
		token: token,
		// Таймаут запроса должен быть больше long-poll таймаута getUpdates.
		httpClient: &http.Client{Timeout: 70 * time.Second},
	}
}

type apiResponse[T any] struct {
	OK          bool   `json:"ok"`
	Result      T      `json:"result"`
	Description string `json:"description"`
}

func call[T any](a *api, method string, payload any) (T, error) {
	var zero T

	body, err := json.Marshal(payload)
	if err != nil {
		return zero, fmt.Errorf("marshal request: %w", err)
	}

	url := apiBaseURL + a.token + "/" + method
	resp, err := a.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return zero, fmt.Errorf("call %s: %w", method, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, fmt.Errorf("read %s response: %w", method, err)
	}

	var parsed apiResponse[T]
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return zero, fmt.Errorf("decode %s response: %w", method, err)
	}

	if !parsed.OK {
		return zero, fmt.Errorf("telegram API %s error: %s", method, parsed.Description)
	}

	return parsed.Result, nil
}

// User — https://core.telegram.org/bots/api#user
type User struct {
	ID       int64  `json:"id"`
	IsBot    bool   `json:"is_bot"`
	Username string `json:"username"`
}

// Chat — https://core.telegram.org/bots/api#chat
type Chat struct {
	ID int64 `json:"id"`
}

// MessageEntity — https://core.telegram.org/bots/api#messageentity
type MessageEntity struct {
	Type   string `json:"type"`
	Offset int    `json:"offset"`
	Length int    `json:"length"`
}

// Message — https://core.telegram.org/bots/api#message (используемое подмножество полей)
type Message struct {
	MessageID int             `json:"message_id"`
	Chat      Chat            `json:"chat"`
	Text      string          `json:"text"`
	Entities  []MessageEntity `json:"entities"`
}

// IsCommand сообщает, начинается ли сообщение с bot_command entity.
func (m Message) IsCommand() bool {
	return len(m.Entities) > 0 && m.Entities[0].Type == "bot_command" && m.Entities[0].Offset == 0
}

// Command возвращает имя команды без "/" и без "@botname".
func (m Message) Command() string {
	if !m.IsCommand() {
		return ""
	}

	entity := m.Entities[0]
	if entity.Length < 1 || entity.Length > len(m.Text) {
		return ""
	}

	command := m.Text[1:entity.Length]
	for i, r := range command {
		if r == '@' {
			return command[:i]
		}
	}
	return command
}

// Update — https://core.telegram.org/bots/api#update (используемое подмножество полей)
type Update struct {
	UpdateID int      `json:"update_id"`
	Message  *Message `json:"message"`
}

// WebAppInfo — https://core.telegram.org/bots/api#webappinfo
type WebAppInfo struct {
	URL string `json:"url"`
}

// InlineKeyboardButton — https://core.telegram.org/bots/api#inlinekeyboardbutton
// (используемое подмножество полей)
type InlineKeyboardButton struct {
	Text   string      `json:"text"`
	WebApp *WebAppInfo `json:"web_app,omitempty"`
}

// InlineKeyboardMarkup — https://core.telegram.org/bots/api#inlinekeyboardmarkup
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

// getMe — https://core.telegram.org/bots/api#getme
func (a *api) getMe() (User, error) {
	return call[User](a, "getMe", struct{}{})
}

type getUpdatesRequest struct {
	Offset  int `json:"offset,omitempty"`
	Timeout int `json:"timeout,omitempty"`
}

// getUpdates — https://core.telegram.org/bots/api#getupdates
func (a *api) getUpdates(offset, timeoutSeconds int) ([]Update, error) {
	return call[[]Update](a, "getUpdates", getUpdatesRequest{Offset: offset, Timeout: timeoutSeconds})
}

type sendMessageRequest struct {
	ChatID      int64                 `json:"chat_id"`
	Text        string                `json:"text"`
	ReplyMarkup *InlineKeyboardMarkup `json:"reply_markup,omitempty"`
}

// sendMessage — https://core.telegram.org/bots/api#sendmessage
func (a *api) sendMessage(chatID int64, text string, markup *InlineKeyboardMarkup) error {
	_, err := call[Message](a, "sendMessage", sendMessageRequest{
		ChatID:      chatID,
		Text:        text,
		ReplyMarkup: markup,
	})
	return err
}
