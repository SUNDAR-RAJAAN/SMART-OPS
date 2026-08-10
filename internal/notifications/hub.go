package notifications

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"smartops/internal/db"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin WebSockets for development
	},
}

type NotificationHub struct {
	mu      sync.RWMutex
	clients map[int]map[*websocket.Conn]bool
	DB      *db.DB
}

func NewNotificationHub() *NotificationHub {
	return &NotificationHub{
		clients: make(map[int]map[*websocket.Conn]bool),
	}
}

func (h *NotificationHub) SetDB(database *db.DB) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.DB = database
}

func (h *NotificationHub) Register(userID int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[*websocket.Conn]bool)
	}
	h.clients[userID][conn] = true
	log.Printf("[Notification Hub] User #%d connected via WebSocket", userID)
}

func (h *NotificationHub) Unregister(userID int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if userConns, ok := h.clients[userID]; ok {
		if _, exists := userConns[conn]; exists {
			delete(userConns, conn)
			conn.Close()
			if len(userConns) == 0 {
				delete(h.clients, userID)
			}
			log.Printf("[Notification Hub] User #%d disconnected from WebSocket", userID)
		}
	}
}

func (h *NotificationHub) PushNotification(userID int, payload interface{}) {
	h.mu.RLock()
	database := h.DB
	userConns, ok := h.clients[userID]

	if ok && len(userConns) > 0 {
		for conn := range userConns {
			if err := conn.WriteJSON(payload); err != nil {
				log.Printf("[Notification Hub] Error writing WS JSON to user #%d: %v", userID, err)
				conn.Close()
			} else {
				log.Printf("[Notification Hub] Real-time WS alert pushed to user #%d", userID)
			}
		}
	} else {
		log.Printf("[Notification Hub] User #%d is offline. Push queued in DB.", userID)
	}
	h.mu.RUnlock()

	// Asynchronously check if user has a Teams Webhook URL set and send notification
	if notif, ok := payload.(Notification); ok {
		SendTeamsWebhookAsync(database, userID, notif.Message)
	}
}

// SendTeamsWebhookAsync checks if user has Teams Webhook URL set and sends notification text
func SendTeamsWebhookAsync(database *db.DB, userID int, message string) {
	if database == nil || strings.TrimSpace(message) == "" {
		return
	}

	go func() {
		var webhookURL string
		query := "SELECT COALESCE(teams_webhook_url, '') FROM users WHERE id = ?"
		if database.Driver == "postgres" {
			query = "SELECT COALESCE(teams_webhook_url, '') FROM users WHERE id = $1"
		}

		err := database.QueryRow(query, userID).Scan(&webhookURL)
		webhookURL = strings.TrimSpace(webhookURL)
		if err != nil || webhookURL == "" {
			return // No Teams webhook set for user
		}

		log.Printf("[Teams Webhook] 🚀 Sending Teams notification to user #%d: '%s'", userID, message)

		payload := map[string]string{
			"text": message,
		}
		jsonBytes, err := json.Marshal(payload)
		if err != nil {
			log.Printf("[Teams Webhook Error] Failed marshaling payload: %v", err)
			return
		}

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Post(webhookURL, "application/json", bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Printf("[Teams Webhook Error] Failed HTTP POST to '%s': %v", webhookURL, err)
			return
		}
		defer resp.Body.Close()

		log.Printf("[Teams Webhook Success] ✅ Sent notification to user #%d Teams channel (HTTP %d)", userID, resp.StatusCode)
	}()
}
