package notifications

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"smartops/internal/db"
	"smartops/internal/middleware"
)

type NotificationHandler struct {
	DB        *db.DB
	Hub       *NotificationHub
	JWTSecret string
}

func NewNotificationHandler(database *db.DB, hub *NotificationHub, jwtSecret string) *NotificationHandler {
	return &NotificationHandler{
		DB:        database,
		Hub:       hub,
		JWTSecret: jwtSecret,
	}
}

type Notification struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	ActorID      *int      `json:"actor_id"`
	Message      string    `json:"message"`
	ReferenceURL string    `json:"reference_url"`
	IsRead       bool      `json:"is_read"`
	CreatedAt    time.Time `json:"created_at"`
}

func (h *NotificationHandler) GetUnread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	query := "SELECT id, user_id, actor_id, message, reference_url, is_read, created_at FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY id DESC"
	if h.DB.Driver == "postgres" {
		query = "SELECT id, user_id, actor_id, message, reference_url, is_read, created_at FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY id DESC"
	}

	rows, err := h.DB.Query(query, claims.UserID)
	if err != nil {
		http.Error(w, `{"error": "Database error fetching unread notifications"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var result []Notification
	for rows.Next() {
		var n Notification
		var refUrl sqlNullString
		if err := rows.Scan(&n.ID, &n.UserID, &n.ActorID, &n.Message, &refUrl, &n.IsRead, &n.CreatedAt); err == nil {
			if refUrl.Valid {
				n.ReferenceURL = refUrl.String
			}
			result = append(result, n)
		}
	}

	if result == nil {
		result = []Notification{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, `{"error": "Invalid notification ID in URL path"}`, http.StatusBadRequest)
		return
	}

	notifID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid notification ID"}`, http.StatusBadRequest)
		return
	}

	query := "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
	if h.DB.Driver == "postgres" {
		query = "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2"
	}

	_, err = h.DB.Exec(query, notifID, claims.UserID)
	if err != nil {
		http.Error(w, `{"error": "Failed to update notification status"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *NotificationHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			tokenStr = authHeader[7:]
		}
	}

	claims, err := middleware.ParseToken(tokenStr, h.JWTSecret)
	if err != nil {
		http.Error(w, "Unauthorized WebSocket connection", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	h.Hub.Register(claims.UserID, conn)

	defer func() {
		h.Hub.Unregister(claims.UserID, conn)
	}()

	// Keep-alive read loop
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

type sqlNullString struct {
	String string
	Valid  bool
}

func (s *sqlNullString) Scan(value interface{}) error {
	if value == nil {
		s.String, s.Valid = "", false
		return nil
	}
	s.Valid = true
	switch v := value.(type) {
	case string:
		s.String = v
	case []byte:
		s.String = string(v)
	}
	return nil
}
