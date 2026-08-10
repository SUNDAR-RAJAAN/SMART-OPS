package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"smartops/internal/analytics"
	"smartops/internal/collaboration"
	"smartops/internal/config"
	"smartops/internal/db"
	"smartops/internal/gateway"
	"smartops/internal/iam"
	"smartops/internal/middleware"
	"smartops/internal/notifications"
	"smartops/internal/stubs"
	"smartops/internal/tasks"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("Starting SmartOps Phase 1 & 2 Full Backend Engine...")
	log.Printf("Database Driver: %s | DB Source: %s", cfg.DBDriver, cfg.DBSource)

	database, err := db.InitDB(cfg.DBDriver, cfg.DBSource)
	if err != nil {
		log.Fatalf("Fatal error initializing database: %v", err)
	}
	defer database.Close()

	// Initialize Python AI service client
	pythonClient := stubs.NewPythonClient(cfg.PythonServiceURL)

	// Notification Hub & Handlers
	notificationHub := notifications.NewNotificationHub()
	notificationHandler := notifications.NewNotificationHandler(database, notificationHub, cfg.JWTSecret)
	collaborationHandler := collaboration.NewCollaborationHandler(database, notificationHub)
	analyticsHandler := analytics.NewAnalyticsHandler(database)

	iamHandler := iam.NewIAMHandler(database, cfg.JWTSecret)
	taskHandler := tasks.NewTaskHandler(database, pythonClient, cfg.UploadDir, notificationHub)
	gatewayHandler := gateway.NewGatewayHandler(database, pythonClient)

	// Middleware wrapper
	authMiddleware := middleware.AuthMiddleware(cfg.JWTSecret)

	mux := http.NewServeMux()

	// 1. IAM Endpoints
	mux.HandleFunc("/auth/login", iamHandler.Login)
	mux.Handle("/users/me", authMiddleware(http.HandlerFunc(iamHandler.GetProfile)))
	mux.Handle("/users/settings", authMiddleware(http.HandlerFunc(iamHandler.UpdateSettings)))

	// 2. Gateway Search Endpoint
	mux.Handle("/search", authMiddleware(http.HandlerFunc(gatewayHandler.Search)))

	// 3. Centralized Notification & WebSocket Engine
	mux.Handle("/notifications/unread", authMiddleware(http.HandlerFunc(notificationHandler.GetUnread)))
	mux.Handle("/notifications/test-teams-webhook", authMiddleware(http.HandlerFunc(notificationHandler.TestTeamsWebhook)))
	mux.HandleFunc("/ws/notifications", notificationHandler.HandleWebSocket)

	// Router for /notifications/{id}/read
	mux.HandleFunc("/notifications/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/read") {
			authMiddleware(http.HandlerFunc(notificationHandler.MarkRead)).ServeHTTP(w, r)
			return
		}
		http.Error(w, `{"error": "Notification route not found"}`, http.StatusNotFound)
	})

	// 4. Analytics Service Endpoints (5-min TTL Caching)
	mux.Handle("/analytics/completion-rate", authMiddleware(http.HandlerFunc(analyticsHandler.GetCompletionRate)))
	mux.Handle("/analytics/overdue", authMiddleware(http.HandlerFunc(analyticsHandler.GetOverdue)))

	// 5. Task & Workflow Engine + Collaboration Endpoints
	mux.Handle("/tasks", authMiddleware(http.HandlerFunc(taskHandler.CreateTask)))

	// Task sub-routes dispatcher
	mux.HandleFunc("/tasks/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if path == "/tasks" || path == "/tasks/" {
			if r.Method == http.MethodPost {
				authMiddleware(http.HandlerFunc(taskHandler.CreateTask)).ServeHTTP(w, r)
				return
			}
		}

		if (r.Method == http.MethodPut || r.Method == http.MethodPatch) && !strings.Contains(path, "/") {
			authMiddleware(http.HandlerFunc(taskHandler.UpdateTask)).ServeHTTP(w, r)
			return
		}

		if r.Method == http.MethodDelete {
			authMiddleware(http.HandlerFunc(taskHandler.DeleteTask)).ServeHTTP(w, r)
			return
		}

		if r.Method == http.MethodPatch && strings.HasSuffix(path, "/status") {
			authMiddleware(http.HandlerFunc(taskHandler.UpdateTaskStatus)).ServeHTTP(w, r)
			return
		}

		if strings.HasSuffix(path, "/comments") {
			if r.Method == http.MethodPost {
				authMiddleware(http.HandlerFunc(collaborationHandler.AddComment)).ServeHTTP(w, r)
				return
			}
			if r.Method == http.MethodGet {
				authMiddleware(http.HandlerFunc(collaborationHandler.GetComments)).ServeHTTP(w, r)
				return
			}
		}

		if r.Method == http.MethodPost {
			if strings.HasSuffix(path, "/triage") {
				authMiddleware(http.HandlerFunc(taskHandler.TriageTask)).ServeHTTP(w, r)
				return
			}
			if strings.HasSuffix(path, "/attachments") {
				authMiddleware(http.HandlerFunc(taskHandler.UploadAttachment)).ServeHTTP(w, r)
				return
			}
			if strings.HasSuffix(path, "/breakdown/confirm") {
				authMiddleware(http.HandlerFunc(taskHandler.ConfirmSubTasks)).ServeHTTP(w, r)
				return
			}
			if strings.HasSuffix(path, "/breakdown") {
				authMiddleware(http.HandlerFunc(taskHandler.AgenticBreakdown)).ServeHTTP(w, r)
				return
			}
			// General task update via POST
			authMiddleware(http.HandlerFunc(taskHandler.UpdateTask)).ServeHTTP(w, r)
			return
		}

		if r.Method == http.MethodPut {
			authMiddleware(http.HandlerFunc(taskHandler.UpdateTask)).ServeHTTP(w, r)
			return
		}

		http.Error(w, `{"error": "Task endpoint route not found"}`, http.StatusNotFound)
	})

	// 6. Static Uploads File Server
	_ = os.MkdirAll(cfg.UploadDir, 0755)
	fileServer := http.FileServer(http.Dir(cfg.UploadDir))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fileServer))

	// Global CORS Handler
	corsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		mux.ServeHTTP(w, r)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("SmartOps Server listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, corsHandler); err != nil {
		log.Fatalf("Server shutdown with error: %v", err)
	}
}
