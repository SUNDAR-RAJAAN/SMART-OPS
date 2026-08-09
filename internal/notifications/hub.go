package notifications

import (
	"log"
	"net/http"
	"sync"

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
}

func NewNotificationHub() *NotificationHub {
	return &NotificationHub{
		clients: make(map[int]map[*websocket.Conn]bool),
	}
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
	defer h.mu.RUnlock()

	userConns, ok := h.clients[userID]
	if !ok || len(userConns) == 0 {
		log.Printf("[Notification Hub] User #%d is offline. Push queued in DB.", userID)
		return
	}

	for conn := range userConns {
		if err := conn.WriteJSON(payload); err != nil {
			log.Printf("[Notification Hub] Error writing WS JSON to user #%d: %v", userID, err)
			conn.Close()
		} else {
			log.Printf("[Notification Hub] Real-time WS alert pushed to user #%d", userID)
		}
	}
}
