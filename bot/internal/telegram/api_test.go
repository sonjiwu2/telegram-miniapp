package telegram

import "testing"

func TestMessageCommand(t *testing.T) {
	cases := []struct {
		name    string
		message Message
		want    string
	}{
		{
			name: "simple start command",
			message: Message{
				Text:     "/start",
				Entities: []MessageEntity{{Type: "bot_command", Offset: 0, Length: 6}},
			},
			want: "start",
		},
		{
			name: "command with bot username suffix",
			message: Message{
				Text:     "/start@reshala_bot",
				Entities: []MessageEntity{{Type: "bot_command", Offset: 0, Length: 18}},
			},
			want: "start",
		},
		{
			name: "plain text is not a command",
			message: Message{
				Text: "привет",
			},
			want: "",
		},
		{
			name: "entity not at offset 0 is not a leading command",
			message: Message{
				Text:     "смотри /start",
				Entities: []MessageEntity{{Type: "bot_command", Offset: 7, Length: 6}},
			},
			want: "",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := tc.message.Command()
			if got != tc.want {
				t.Errorf("Command() = %q, want %q", got, tc.want)
			}
		})
	}
}
