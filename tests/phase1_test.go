package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"smartops/internal/db"
	"smartops/internal/gateway"
	"smartops/internal/iam"
	"smartops/internal/middleware"
	"smartops/internal/notifications"
	"smartops/internal/stubs"
	"smartops/internal/tasks"
)

func setupTestServer(t *testing.T) (*httptest.Server, string, string) {
	tempDB := filepath.Join(t.TempDir(), "test_smartops.db")
	database, err := db.InitDB("sqlite", tempDB)
	if err != nil {
		t.Fatalf("Failed to initialize test DB: %v", err)
	}
	t.Cleanup(func() {
		database.Close()
	})

	tempUploads := t.TempDir()
	jwtSecret := "test_secret_key"
	pythonClient := stubs.NewPythonClient("http://localhost:9999")
	hub := notifications.NewNotificationHub()

	iamHandler := iam.NewIAMHandler(database, jwtSecret)
	taskHandler := tasks.NewTaskHandler(database, pythonClient, tempUploads, hub)
	gatewayHandler := gateway.NewGatewayHandler(database, pythonClient)
	authMiddleware := middleware.AuthMiddleware(jwtSecret)

	mux := http.NewServeMux()
	mux.HandleFunc("/auth/login", iamHandler.Login)
	mux.Handle("/users/me", authMiddleware(http.HandlerFunc(iamHandler.GetProfile)))
	mux.Handle("/search", authMiddleware(http.HandlerFunc(gatewayHandler.Search)))

	mux.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
		authMiddleware(http.HandlerFunc(taskHandler.CreateTask)).ServeHTTP(w, r)
	})

	mux.HandleFunc("/tasks/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPatch && strings.HasSuffix(r.URL.Path, "/status") {
			authMiddleware(http.HandlerFunc(taskHandler.UpdateTaskStatus)).ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodPost {
			if strings.HasSuffix(r.URL.Path, "/attachments") {
				authMiddleware(http.HandlerFunc(taskHandler.UploadAttachment)).ServeHTTP(w, r)
				return
			}
			if strings.HasSuffix(r.URL.Path, "/breakdown/confirm") {
				authMiddleware(http.HandlerFunc(taskHandler.ConfirmSubTasks)).ServeHTTP(w, r)
				return
			}
			if strings.HasSuffix(r.URL.Path, "/breakdown") {
				authMiddleware(http.HandlerFunc(taskHandler.AgenticBreakdown)).ServeHTTP(w, r)
				return
			}
		}
		http.Error(w, "Not found", http.StatusNotFound)
	})

	server := httptest.NewServer(mux)

	// Obtain JWT Token for test requests
	token, err := middleware.GenerateToken(1, "admin@smartops.io", "admin", 1, jwtSecret)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}

	return server, token, tempUploads
}

func TestIAM_LoginAndGetProfile(t *testing.T) {
	server, token, _ := setupTestServer(t)
	defer server.Close()

	// 1. Test Login Endpoint
	loginBody := `{"email": "admin@smartops.io"}`
	resp, err := http.Post(server.URL+"/auth/login", "application/json", strings.NewReader(loginBody))
	if err != nil {
		t.Fatalf("Login POST failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 on login, got %d", resp.StatusCode)
	}

	var loginRes iam.LoginResponse
	json.NewDecoder(resp.Body).Decode(&loginRes)
	if loginRes.Token == "" || loginRes.User.Email != "admin@smartops.io" {
		t.Fatalf("Unexpected login response payload: %+v", loginRes)
	}

	// 2. Test Get Profile Endpoint (/users/me)
	req, _ := http.NewRequest("GET", server.URL+"/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		t.Fatalf("GET /users/me failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 on /users/me, got %d", resp.StatusCode)
	}

	var profile iam.UserProfile
	json.NewDecoder(resp.Body).Decode(&profile)
	if profile.Role != "admin" || profile.Email != "admin@smartops.io" {
		t.Fatalf("Unexpected profile response: %+v", profile)
	}
}

func TestTaskEngine_CRUD_And_Breakdown(t *testing.T) {
	server, token, uploadDir := setupTestServer(t)
	defer server.Close()
	client := &http.Client{}

	// 1. Create Task (POST /tasks)
	taskPayload := `{"title": "Implement API Gateway", "desc": "Build routing layer in Go", "status": "todo", "priority": "high"}`
	req, _ := http.NewRequest("POST", server.URL+"/tasks", strings.NewReader(taskPayload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("Create task failed: status %d, err: %v", resp.StatusCode, err)
	}

	var createdTask tasks.Task
	json.NewDecoder(resp.Body).Decode(&createdTask)
	if createdTask.ID == 0 || createdTask.Title != "Implement API Gateway" {
		t.Fatalf("Invalid task returned: %+v", createdTask)
	}

	// 2. Update Status (PATCH /tasks/{id}/status)
	statusPayload := `{"status": "in_progress"}`
	req, _ = http.NewRequest("PATCH", fmt.Sprintf("%s/tasks/%d/status", server.URL, createdTask.ID), strings.NewReader(statusPayload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Update status failed: status %d, err: %v", resp.StatusCode, err)
	}

	var updatedTask tasks.Task
	json.NewDecoder(resp.Body).Decode(&updatedTask)
	if updatedTask.Status != "in_progress" {
		t.Fatalf("Expected updated status 'in_progress', got '%s'", updatedTask.Status)
	}

	// 3. Upload Attachment (POST /tasks/{id}/attachments)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test_spec.txt")
	part.Write([]byte("Sample design specs for task"))
	writer.Close()

	req, _ = http.NewRequest("POST", fmt.Sprintf("%s/tasks/%d/attachments", server.URL, createdTask.ID), body)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("Upload attachment failed: status %d, err: %v", resp.StatusCode, err)
	}

	var attach tasks.Attachment
	json.NewDecoder(resp.Body).Decode(&attach)
	if attach.TaskID != createdTask.ID || !strings.HasPrefix(attach.FileURL, "/uploads/") {
		t.Fatalf("Unexpected attachment payload: %+v", attach)
	}

	// Check file written to disk
	files, _ := os.ReadDir(uploadDir)
	if len(files) == 0 {
		t.Fatalf("Expected uploaded file in uploadDir %s, but found none", uploadDir)
	}

	// 4. Agentic Breakdown Draft Suggestions (POST /tasks/{id}/breakdown)
	req, _ = http.NewRequest("POST", fmt.Sprintf("%s/tasks/%d/breakdown", server.URL, createdTask.ID), nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Agentic breakdown draft request failed: status %d, err: %v", resp.StatusCode, err)
	}

	var drafts []stubs.SubTaskSuggestion
	json.NewDecoder(resp.Body).Decode(&drafts)
	if len(drafts) == 0 {
		t.Fatalf("Expected draft sub-task suggestions, got 0")
	}

	// 5. Confirm Approved Sub-tasks (POST /tasks/{id}/breakdown/confirm)
	draftBytes, _ := json.Marshal(drafts)
	req, _ = http.NewRequest("POST", fmt.Sprintf("%s/tasks/%d/breakdown/confirm", server.URL, createdTask.ID), bytes.NewBuffer(draftBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("Confirm sub-tasks failed: status %d, err: %v", resp.StatusCode, err)
	}

	var subTasks []tasks.Task
	json.NewDecoder(resp.Body).Decode(&subTasks)
	if len(subTasks) == 0 {
		t.Fatalf("Expected created sub-tasks after confirmation, got 0")
	}
	for _, sub := range subTasks {
		if sub.ParentTaskID == nil || *sub.ParentTaskID != createdTask.ID {
			t.Fatalf("Subtask missing valid parent_task_id: %+v", sub)
		}
	}
}

func TestGateway_SmartSearch(t *testing.T) {
	server, token, _ := setupTestServer(t)
	defer server.Close()
	client := &http.Client{}

	// Seed tasks for search
	tasksList := []string{
		"Exact Match Target Task",
		"Fuzzy Match Database Migration Task",
		"Another Miscellaneous Backend Feature",
	}

	for _, title := range tasksList {
		payload := fmt.Sprintf(`{"title": "%s", "desc": "Search test task", "status": "todo"}`, title)
		req, _ := http.NewRequest("POST", server.URL+"/tasks", strings.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		resp, _ := client.Do(req)
		resp.Body.Close()
	}

	// Execute GET /search?q=Database
	req, _ := http.NewRequest("GET", server.URL+"/search?q=Database", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("Search failed: status %d, err: %v", resp.StatusCode, err)
	}

	var searchRes gateway.SearchResponse
	json.NewDecoder(resp.Body).Decode(&searchRes)

	if searchRes.Query != "Database" || len(searchRes.Results) == 0 {
		t.Fatalf("Search expected results for 'Database', got: %+v", searchRes)
	}
}
