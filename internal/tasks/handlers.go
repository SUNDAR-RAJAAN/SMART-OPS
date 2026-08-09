package tasks

import (
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"smartops/internal/db"
	"smartops/internal/middleware"
	"smartops/internal/notifications"
	"smartops/internal/stubs"
)

type TaskHandler struct {
	DB              *db.DB
	PythonClient    *stubs.PythonClient
	UploadDir       string
	NotificationHub *notifications.NotificationHub
}

func NewTaskHandler(database *db.DB, pythonClient *stubs.PythonClient, uploadDir string, hub *notifications.NotificationHub) *TaskHandler {
	return &TaskHandler{
		DB:              database,
		PythonClient:    pythonClient,
		UploadDir:       uploadDir,
		NotificationHub: hub,
	}
}

type Task struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"desc"`
	Status       string    `json:"status"`
	Priority     string    `json:"priority"`
	AssigneeID   *int      `json:"assignee_id"`
	ReporterID   *int      `json:"reporter_id"`
	ParentTaskID *int      `json:"parent_task_id"`
	CreatedAt    time.Time `json:"created_at"`
}

type Attachment struct {
	ID         int       `json:"id"`
	TaskID     int       `json:"task_id"`
	UploaderID int       `json:"uploader_id"`
	FileURL    string    `json:"file_url"`
	FileType   string    `json:"file_type"`
	CreatedAt  time.Time `json:"created_at"`
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		Title        string `json:"title"`
		Description  string `json:"desc"`
		Status       string `json:"status"`
		Priority     string `json:"priority"`
		AssigneeID   *int   `json:"assignee_id"`
		ReporterID   *int   `json:"reporter_id"`
		ParentTaskID *int   `json:"parent_task_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		http.Error(w, `{"error": "Invalid task payload: title is required"}`, http.StatusBadRequest)
		return
	}

	if req.Status == "" {
		req.Status = "todo"
	}
	if req.Priority == "" {
		req.Priority = "medium"
	}

	reporterID := claims.UserID
	if req.ReporterID != nil && *req.ReporterID > 0 {
		reporterID = *req.ReporterID
	}
	now := time.Now()

	var taskID int
	if h.DB.Driver == "postgres" {
		query := `INSERT INTO tasks (title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
		err := h.DB.QueryRow(query, req.Title, req.Description, req.Status, req.Priority, req.AssigneeID, reporterID, req.ParentTaskID, now).Scan(&taskID)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to insert task: %v"}`, err), http.StatusInternalServerError)
			return
		}
	} else {
		query := `INSERT INTO tasks (title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at)
		          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		res, err := h.DB.Exec(query, req.Title, req.Description, req.Status, req.Priority, req.AssigneeID, reporterID, req.ParentTaskID, now)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Failed to insert task: %v"}`, err), http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		taskID = int(id)
	}

	task := Task{
		ID:           taskID,
		Title:        req.Title,
		Description:  req.Description,
		Status:       req.Status,
		Priority:     req.Priority,
		AssigneeID:   req.AssigneeID,
		ReporterID:   &reporterID,
		ParentTaskID: req.ParentTaskID,
		CreatedAt:    now,
	}

	// Trigger asynchronous vector DB sync
	h.PythonClient.SyncTaskToVectorDB(task.ID, task.Title, task.Description)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPatch {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"desc"`
		Priority    string `json:"priority"`
		AssigneeID  *int   `json:"assignee_id"`
		ReporterID  *int   `json:"reporter_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		http.Error(w, `{"error": "Title cannot be empty"}`, http.StatusBadRequest)
		return
	}

	query := "UPDATE tasks SET title = ?, description = ?, priority = ?, assignee_id = ?, reporter_id = ? WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "UPDATE tasks SET title = $1, description = $2, priority = $3, assignee_id = $4, reporter_id = $5 WHERE id = $6"
	}

	_, err = h.DB.Exec(query, req.Title, req.Description, req.Priority, req.AssigneeID, req.ReporterID, taskID)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed updating task: %v"}`, err), http.StatusInternalServerError)
		return
	}

	task, err := h.getTaskByID(taskID)
	if err != nil {
		http.Error(w, `{"error": "Task updated but failed to load record"}`, http.StatusInternalServerError)
		return
	}

	// Sync vector DB
	h.PythonClient.SyncTaskToVectorDB(task.ID, task.Title, task.Description)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	query := "DELETE FROM tasks WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "DELETE FROM tasks WHERE id = $1"
	}

	_, err = h.DB.Exec(query, taskID)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed deleting task: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "deleted", "id": taskID})
}

func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, _ := middleware.UserFromContext(r.Context())

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] != "status" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Status) == "" {
		http.Error(w, `{"error": "Invalid request body: status required"}`, http.StatusBadRequest)
		return
	}

	query := "UPDATE tasks SET status = ? WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "UPDATE tasks SET status = $1 WHERE id = $2"
	}

	_, err = h.DB.Exec(query, req.Status, taskID)
	if err != nil {
		http.Error(w, `{"error": "Database error updating task status"}`, http.StatusInternalServerError)
		return
	}

	task, err := h.getTaskByID(taskID)
	if err != nil {
		http.Error(w, `{"error": "Task updated but failed to fetch updated record"}`, http.StatusInternalServerError)
		return
	}

	// HIGH-PRIORITY FEATURE: Notify Assignee & Reporter when task status changes!
	go h.notifyStatusChange(task, claims)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) notifyStatusChange(task *Task, actorClaims *middleware.JWTClaims) {
	actorEmail := "A user"
	actorID := 0
	if actorClaims != nil {
		actorEmail = actorClaims.Email
		actorID = actorClaims.UserID
	}

	statusFormatted := strings.ReplaceAll(task.Status, "_", " ")
	message := fmt.Sprintf("Task #%d ('%s') status changed to '%s' by %s", task.ID, task.Title, statusFormatted, actorEmail)
	refURL := fmt.Sprintf("/tasks/%d", task.ID)
	now := time.Now()

	notifyUserIDs := make(map[int]bool)
	if task.AssigneeID != nil && *task.AssigneeID > 0 && *task.AssigneeID != actorID {
		notifyUserIDs[*task.AssigneeID] = true
	}
	if task.ReporterID != nil && *task.ReporterID > 0 && *task.ReporterID != actorID {
		notifyUserIDs[*task.ReporterID] = true
	}

	for targetID := range notifyUserIDs {
		var notifID int
		if h.DB.Driver == "postgres" {
			nQuery := `INSERT INTO notifications (user_id, actor_id, message, reference_url, is_read, created_at)
			           VALUES ($1, $2, $3, $4, false, $5) RETURNING id`
			_ = h.DB.QueryRow(nQuery, targetID, actorID, message, refURL, now).Scan(&notifID)
		} else {
			nQuery := `INSERT INTO notifications (user_id, actor_id, message, reference_url, is_read, created_at)
			           VALUES (?, ?, ?, ?, 0, ?)`
			res, err := h.DB.Exec(nQuery, targetID, actorID, message, refURL, now)
			if err == nil {
				id, _ := res.LastInsertId()
				notifID = int(id)
			}
		}

		payload := notifications.Notification{
			ID:           notifID,
			UserID:       targetID,
			ActorID:      &actorID,
			Message:      message,
			ReferenceURL: refURL,
			IsRead:       false,
			CreatedAt:    now,
		}

		if h.NotificationHub != nil {
			h.NotificationHub.PushNotification(targetID, payload)
		}
	}
}

func (h *TaskHandler) UploadAttachment(w http.ResponseWriter, r *http.Request) {
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
	if len(pathParts) < 3 || pathParts[2] != "attachments" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid task ID"}`, http.StatusBadRequest)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error": "File exceeds max allowed size of 10MB"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error": "Failed to read file parameter"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	if err := os.MkdirAll(h.UploadDir, 0755); err != nil {
		http.Error(w, `{"error": "Failed to create uploads directory"}`, http.StatusInternalServerError)
		return
	}

	ext := filepath.Ext(header.Filename)
	uniqueFilename := fmt.Sprintf("%d_%d%s", taskID, time.Now().UnixNano(), ext)
	dstPath := filepath.Join(h.UploadDir, uniqueFilename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, `{"error": "Failed to save file on disk"}`, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, `{"error": "Failed writing file bytes"}`, http.StatusInternalServerError)
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", uniqueFilename)
	fileType := mime.TypeByExtension(ext)
	if fileType == "" {
		fileType = "application/octet-stream"
	}

	now := time.Now()
	var attachID int

	if h.DB.Driver == "postgres" {
		query := `INSERT INTO attachments (task_id, uploader_id, file_url, file_type, created_at)
		          VALUES ($1, $2, $3, $4, $5) RETURNING id`
		err := h.DB.QueryRow(query, taskID, claims.UserID, fileURL, fileType, now).Scan(&attachID)
		if err != nil {
			http.Error(w, `{"error": "Failed saving attachment record in DB"}`, http.StatusInternalServerError)
			return
		}
	} else {
		query := `INSERT INTO attachments (task_id, uploader_id, file_url, file_type, created_at)
		          VALUES (?, ?, ?, ?, ?)`
		res, err := h.DB.Exec(query, taskID, claims.UserID, fileURL, fileType, now)
		if err != nil {
			http.Error(w, `{"error": "Failed saving attachment record in DB"}`, http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		attachID = int(id)
	}

	attachment := Attachment{
		ID:         attachID,
		TaskID:     taskID,
		UploaderID: claims.UserID,
		FileURL:    fileURL,
		FileType:   fileType,
		CreatedAt:  now,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(attachment)
}

// AgenticBreakdown returns candidate draft sub-tasks WITHOUT inserting into DB immediately (Issue #1 requirement)
func (h *TaskHandler) AgenticBreakdown(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 || pathParts[2] != "breakdown" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	parentTaskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid parent task ID"}`, http.StatusBadRequest)
		return
	}

	parentTask, err := h.getTaskByID(parentTaskID)
	if err != nil {
		http.Error(w, `{"error": "Parent task not found"}`, http.StatusNotFound)
		return
	}

	// Generate temporary draft sub-task suggestions from Python AI service
	suggestions, err := h.PythonClient.GenerateSubTasks(parentTask.ID, parentTask.Title, parentTask.Description)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed generating sub-task drafts: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suggestions)
}

// ConfirmSubTasks persists user-approved draft sub-tasks into database (Issue #1 requirement)
func (h *TaskHandler) ConfirmSubTasks(w http.ResponseWriter, r *http.Request) {
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
	if len(pathParts) < 3 || pathParts[2] != "breakdown" {
		http.Error(w, `{"error": "Invalid URL path"}`, http.StatusBadRequest)
		return
	}

	parentTaskID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, `{"error": "Invalid parent task ID"}`, http.StatusBadRequest)
		return
	}

	parentTask, err := h.getTaskByID(parentTaskID)
	if err != nil {
		http.Error(w, `{"error": "Parent task not found"}`, http.StatusNotFound)
		return
	}

	var approvedItems []stubs.SubTaskSuggestion
	if err := json.NewDecoder(r.Body).Decode(&approvedItems); err != nil || len(approvedItems) == 0 {
		http.Error(w, `{"error": "No approved sub-tasks provided"}`, http.StatusBadRequest)
		return
	}

	var createdSubTasks []Task
	reporterID := claims.UserID

	for _, sub := range approvedItems {
		now := time.Now()
		var subID int

		if h.DB.Driver == "postgres" {
			query := `INSERT INTO tasks (title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at)
			          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
			err := h.DB.QueryRow(query, sub.Title, sub.Description, "todo", "medium", parentTask.AssigneeID, reporterID, parentTask.ID, now).Scan(&subID)
			if err != nil {
				continue
			}
		} else {
			query := `INSERT INTO tasks (title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at)
			          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			res, err := h.DB.Exec(query, sub.Title, sub.Description, "todo", "medium", parentTask.AssigneeID, reporterID, parentTask.ID, now)
			if err != nil {
				continue
			}
			id, _ := res.LastInsertId()
			subID = int(id)
		}

		subTask := Task{
			ID:           subID,
			Title:        sub.Title,
			Description:  sub.Description,
			Status:       "todo",
			Priority:     "medium",
			AssigneeID:   parentTask.AssigneeID,
			ReporterID:   &reporterID,
			ParentTaskID: &parentTask.ID,
			CreatedAt:    now,
		}

		h.PythonClient.SyncTaskToVectorDB(subTask.ID, subTask.Title, subTask.Description)
		createdSubTasks = append(createdSubTasks, subTask)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdSubTasks)
}

func (h *TaskHandler) getTaskByID(id int) (*Task, error) {
	var t Task
	query := "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = $1"
	}

	err := h.DB.QueryRow(query, id).Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.AssigneeID, &t.ReporterID, &t.ParentTaskID, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
