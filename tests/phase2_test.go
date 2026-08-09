package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"smartops/internal/analytics"
	"smartops/internal/collaboration"
	"smartops/internal/db"
	"smartops/internal/middleware"
	"smartops/internal/notifications"
)

func setupPhase2Server(t *testing.T) (*httptest.Server, string, string, *db.DB) {
	tempDB := filepath.Join(t.TempDir(), "test_phase2.db")
	database, err := db.InitDB("sqlite", tempDB)
	if err != nil {
		t.Fatalf("Failed to initialize test DB: %v", err)
	}

	t.Cleanup(func() {
		database.Close()
	})

	jwtSecret := "phase2_test_secret"
	hub := notifications.NewNotificationHub()
	collabHandler := collaboration.NewCollaborationHandler(database, hub)
	notifHandler := notifications.NewNotificationHandler(database, hub, jwtSecret)
	analyticsHandler := analytics.NewAnalyticsHandler(database)
	authMiddleware := middleware.AuthMiddleware(jwtSecret)

	mux := http.NewServeMux()
	mux.Handle("/notifications/unread", authMiddleware(http.HandlerFunc(notifHandler.GetUnread)))
	mux.HandleFunc("/notifications/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/read") {
			authMiddleware(http.HandlerFunc(notifHandler.MarkRead)).ServeHTTP(w, r)
		}
	})

	mux.Handle("/analytics/completion-rate", authMiddleware(http.HandlerFunc(analyticsHandler.GetCompletionRate)))
	mux.Handle("/analytics/overdue", authMiddleware(http.HandlerFunc(analyticsHandler.GetOverdue)))

	mux.HandleFunc("/tasks/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/comments") {
			if r.Method == http.MethodPost {
				authMiddleware(http.HandlerFunc(collabHandler.AddComment)).ServeHTTP(w, r)
				return
			}
			if r.Method == http.MethodGet {
				authMiddleware(http.HandlerFunc(collabHandler.GetComments)).ServeHTTP(w, r)
				return
			}
		}
	})

	server := httptest.NewServer(mux)

	// Generate tokens for Admin (User 1) and Dev (User 3)
	adminToken, _ := middleware.GenerateToken(1, "admin@smartops.io", "admin", 1, jwtSecret)
	devToken, _ := middleware.GenerateToken(3, "dev@smartops.io", "employee", 1, jwtSecret)

	return server, adminToken, devToken, database
}

func TestPhase2_CommentsAndMentions(t *testing.T) {
	server, adminToken, devToken, database := setupPhase2Server(t)
	defer server.Close()
	client := &http.Client{}

	// Seed a task
	database.Exec("INSERT INTO tasks (title, description, status, priority) VALUES ('API Review', 'Test task', 'todo')")

	// 1. Admin posts a comment mentioning @dev@smartops.io
	commentBody := `{"content": "Please review this update @dev@smartops.io"}`
	req, _ := http.NewRequest("POST", server.URL+"/tasks/1/comments", strings.NewReader(commentBody))
	req.Header.Set("Authorization", "Bearer "+adminToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("Add comment failed: status %d, err: %v", resp.StatusCode, err)
	}

	var createdComment collaboration.Comment
	json.NewDecoder(resp.Body).Decode(&createdComment)
	if createdComment.TaskID != 1 || createdComment.UserEmail != "admin@smartops.io" {
		t.Fatalf("Unexpected comment payload: %+v", createdComment)
	}

	// 2. Fetch comments list (GET /tasks/1/comments)
	req, _ = http.NewRequest("GET", server.URL+"/tasks/1/comments", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Get comments failed: status %d, err: %v", resp.StatusCode, err)
	}

	var commentsList []collaboration.Comment
	json.NewDecoder(resp.Body).Decode(&commentsList)
	if len(commentsList) != 1 || commentsList[0].Content != createdComment.Content {
		t.Fatalf("Unexpected comments list: %+v", commentsList)
	}

	// 3. Dev user checks unread notifications (GET /notifications/unread)
	req, _ = http.NewRequest("GET", server.URL+"/notifications/unread", nil)
	req.Header.Set("Authorization", "Bearer "+devToken)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Get unread notifications failed: status %d, err: %v", resp.StatusCode, err)
	}

	var unreadList []notifications.Notification
	json.NewDecoder(resp.Body).Decode(&unreadList)
	if len(unreadList) != 1 || !strings.Contains(unreadList[0].Message, "mentioned you") {
		t.Fatalf("Expected mention notification for dev user, got: %+v", unreadList)
	}

	// 4. Dev user marks notification as read (POST /notifications/{id}/read)
	req, _ = http.NewRequest("POST", fmt.Sprintf("%s/notifications/%d/read", server.URL, unreadList[0].ID), nil)
	req.Header.Set("Authorization", "Bearer "+devToken)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Mark read failed: status %d, err: %v", resp.StatusCode, err)
	}

	// Verify unread count is now 0
	req, _ = http.NewRequest("GET", server.URL+"/notifications/unread", nil)
	req.Header.Set("Authorization", "Bearer "+devToken)
	resp, _ = client.Do(req)
	var unreadAfter []notifications.Notification
	json.NewDecoder(resp.Body).Decode(&unreadAfter)
	if len(unreadAfter) != 0 {
		t.Fatalf("Expected 0 unread notifications after mark read, got %d", len(unreadAfter))
	}
}

func TestPhase2_AnalyticsAndTTLCache(t *testing.T) {
	server, adminToken, _, database := setupPhase2Server(t)
	defer server.Close()
	client := &http.Client{}

	// Seed tasks for metrics
	database.Exec("INSERT INTO tasks (title, status, priority) VALUES ('Task 1', 'done', 'high')")
	database.Exec("INSERT INTO tasks (title, status, priority) VALUES ('Task 2', 'in_progress', 'medium')")

	// 1. GET /analytics/completion-rate (First call -> MISS)
	req, _ := http.NewRequest("GET", server.URL+"/analytics/completion-rate", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Analytics completion-rate failed: status %d, err: %v", resp.StatusCode, err)
	}
	if resp.Header.Get("X-Cache") != "MISS" {
		t.Fatalf("Expected X-Cache: MISS on first request, got %s", resp.Header.Get("X-Cache"))
	}

	var stats analytics.CompletionStats
	json.NewDecoder(resp.Body).Decode(&stats)
	if stats.TotalTasks != 2 || stats.CompletedTasks != 1 || stats.CompletionRate != 50.0 {
		t.Fatalf("Unexpected completion stats: %+v", stats)
	}

	// 2. GET /analytics/completion-rate (Second call -> HIT from 5-min TTL cache)
	req, _ = http.NewRequest("GET", server.URL+"/analytics/completion-rate", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Analytics completion-rate 2nd call failed: %v", err)
	}
	if resp.Header.Get("X-Cache") != "HIT" {
		t.Fatalf("Expected X-Cache: HIT on cached request, got %s", resp.Header.Get("X-Cache"))
	}

	// 3. GET /analytics/overdue
	req, _ = http.NewRequest("GET", server.URL+"/analytics/overdue", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Analytics overdue call failed: %v", err)
	}

	var overdueStats analytics.OverdueStats
	json.NewDecoder(resp.Body).Decode(&overdueStats)
	if overdueStats.PendingCount != 1 {
		t.Fatalf("Expected 1 pending task, got %d", overdueStats.PendingCount)
	}
}
