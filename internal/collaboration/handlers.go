package collaboration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"smartops/internal/db"
	"smartops/internal/middleware"
	"smartops/internal/notifications"
)

type CollaborationHandler struct {
	DB  *db.DB
	Hub *notifications.NotificationHub
}

func NewCollaborationHandler(database *db.DB, hub *notifications.NotificationHub) *CollaborationHandler {
	return &CollaborationHandler{
		DB:  database,
		Hub: hub,
	}
}

type Comment struct {
	ID        int       `json:"id"`
	TaskID    int       `json:"task_id"`
	UserID    int       `json:"user_id"`
	UserEmail string    `json:"user_email"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *CollaborationHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] != "comments" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		http.Error(w, `{"error": "Comment content cannot be empty"}`, http.StatusBadRequest)
		return
	}

	now := time.Now()
	var commentID int

	if h.DB.Driver == "postgres" {
		query := `INSERT INTO comments (task_id, user_id, content, created_at) VALUES ($1, $2, $3, $4) RETURNING id`
		err := h.DB.QueryRow(query, taskID, claims.UserID, req.Content, now).Scan(&commentID)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to save comment: %v"}`, err), http.StatusInternalServerError)
			return
		}
	} else {
		query := `INSERT INTO comments (task_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`
		res, err := h.DB.Exec(query, taskID, claims.UserID, req.Content, now)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to save comment: %v"}`, err), http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		commentID = int(id)
	}

	comment := Comment{
		ID:        commentID,
		TaskID:    taskID,
		UserID:    claims.UserID,
		UserEmail: claims.Email,
		Content:   req.Content,
		CreatedAt: now,
	}

	// Parse @mentions (e.g. @dev@smartops.io or @admin)
	go h.processMentions(claims.UserID, claims.Email, taskID, req.Content)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

func (h *CollaborationHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] != "comments" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	query := `SELECT c.id, c.task_id, c.user_id, u.email, c.content, c.created_at
	          FROM comments c
	          JOIN users u ON c.user_id = u.id
	          WHERE c.task_id = ? ORDER BY c.id ASC`

	if h.DB.Driver == "postgres" {
		query = `SELECT c.id, c.task_id, c.user_id, u.email, c.content, c.created_at
		          FROM comments c
		          JOIN users u ON c.user_id = u.id
		          WHERE c.task_id = $1 ORDER BY c.id ASC`
	}

	rows, err := h.DB.Query(query, taskID)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch comments"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.TaskID, &c.UserID, &c.UserEmail, &c.Content, &c.CreatedAt); err == nil {
			comments = append(comments, c)
		}
	}

	if comments == nil {
		comments = []Comment{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func (h *CollaborationHandler) processMentions(actorID int, actorEmail string, taskID int, content string) {
	// Match @email or @name pattern
	re := regexp.MustCompile(`@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_]+)`)
	matches := re.FindAllStringSubmatch(content, -1)

	if len(matches) == 0 {
		return
	}

	seenUsers := make(map[int]bool)

	for _, match := range matches {
		handle := match[1]
		var targetUserID int

		// Look up user by email or handle substring
		query := "SELECT id FROM users WHERE email = ? OR email LIKE ?"
		if h.DB.Driver == "postgres" {
			query = "SELECT id FROM users WHERE email = $1 OR email ILIKE $2"
		}

		err := h.DB.QueryRow(query, handle, "%"+handle+"%").Scan(&targetUserID)
		if err != nil || targetUserID == actorID || seenUsers[targetUserID] {
			continue
		}

		seenUsers[targetUserID] = true
		message := fmt.Sprintf("%s mentioned you in a comment on task #%d", actorEmail, taskID)
		refURL := fmt.Sprintf("/tasks/%d", taskID)
		now := time.Now()

		var notifID int
		if h.DB.Driver == "postgres" {
			nQuery := `INSERT INTO notifications (user_id, actor_id, message, reference_url, is_read, created_at)
			           VALUES ($1, $2, $3, $4, false, $5) RETURNING id`
			_ = h.DB.QueryRow(nQuery, targetUserID, actorID, message, refURL, now).Scan(&notifID)
		} else {
			nQuery := `INSERT INTO notifications (user_id, actor_id, message, reference_url, is_read, created_at)
			           VALUES (?, ?, ?, ?, 0, ?)`
			res, err := h.DB.Exec(nQuery, targetUserID, actorID, message, refURL, now)
			if err == nil {
				id, _ := res.LastInsertId()
				notifID = int(id)
			}
		}

		notificationPayload := notifications.Notification{
			ID:           notifID,
			UserID:       targetUserID,
			ActorID:      &actorID,
			Message:      message,
			ReferenceURL: refURL,
			IsRead:       false,
			CreatedAt:    now,
		}

		// Push real-time alert over WebSocket hub if online
		h.Hub.PushNotification(targetUserID, notificationPayload)
	}
}
